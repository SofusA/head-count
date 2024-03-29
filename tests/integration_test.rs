#[cfg(test)]
mod tests {
    use chrono::Utc;
    use dotenv::dotenv;
    use sensor::{
        app::{app, heartbeat::start_heartbeat_and_retry},
        handler::count::handle_add_count,
        models::{
            count::CountEntry,
            database::{get_database, Credentials},
            request::Request,
        },
        store::{delete_record, read_store, store},
    };
    use std::env;
    use std::{
        net::{SocketAddr, TcpListener},
        time::Duration,
    };

    fn get_endpoint(addr: SocketAddr, endpoint: &str) -> String {
        format!("http://{}/{}", addr, endpoint)
    }

    fn get_test_credentials() -> Credentials {
        dotenv().ok();
        let url = env::var("DATABASE_URL").unwrap();
        let secret = env::var("DATABASE_SECRET").unwrap();

        Credentials {
            url,
            secret,
            count_table: "counter_test".to_string(),
            sensor_table: "sensor_test".to_string(),
            sensor_name: "test;test_sensor".to_string(),
        }
    }

    #[tokio::test]
    async fn smoke_test() {
        let credentials = get_test_credentials();
        let addr = spawn_service_and_get_address(credentials);
        let endpoint = get_endpoint(addr, "smoke");

        let client = reqwest::Client::new();
        let response: String = client
            .post(endpoint)
            .header("Content-Type", "application/json")
            .send()
            .await
            .unwrap()
            .text()
            .await
            .unwrap();

        assert_eq!(response, "Ok");
    }

    #[tokio::test]
    async fn retry_test() {
        let now = Utc::now().timestamp_millis();
        let credentials = get_test_credentials();
        let database = get_database(credentials.clone());
        let sensor_name = credentials.sensor_name.clone();

        let entry = CountEntry {
            time: now,
            door: sensor_name.clone(),
            location: "test".to_string(),
            direction_in: 1,
            direction_out: 0,
            nightowl: false,
        };

        store(entry.clone()).unwrap();
        tokio::time::sleep(Duration::new(0, 5000)).await;

        start_heartbeat_and_retry(credentials, 1);

        tokio::time::sleep(Duration::new(1, 0)).await;

        let result = database.get_count(now).await.unwrap();
        database.delete_count(now).await.unwrap();
        assert_eq!(entry, result);

        let heartbeats = database.get_sensor_entries().await.unwrap();
        let heartbeat = heartbeats.iter().find(|x| x.door == sensor_name).unwrap();
        database.delete_sensor_entry(sensor_name).await.unwrap();
        assert!(heartbeat.heartbeat.unwrap() > now);
    }

    #[tokio::test]
    async fn store_test() {
        let bad_credentials = Credentials {
            url: "test.com/api/v1".to_string(),
            secret: "supersecret".to_string(),
            count_table: "count".to_string(),
            sensor_table: "sensor".to_string(),
            sensor_name: "test;testing".to_string(),
        };
        let bad_database = get_database(bad_credentials);

        let time = "2050-01-01T18:00:00+01:00".to_string();
        let request = get_test_request(time);
        let entry = request.to_count().unwrap();
        match handle_add_count(&bad_database, request).await {
            Ok(_) => panic!("This should fail, but it did not"),
            Err(_) => println!("This failed as it shoud"),
        };

        tokio::time::sleep(Duration::new(0, 5000)).await;

        let store = read_store();
        let store_result = store
            .iter()
            .filter(|x| x.entry.time == entry.timestamp)
            .last()
            .unwrap();
        delete_record(store_result.path.clone());

        assert_eq!(entry, store_result.entry.to_count());
    }

    fn get_test_request(time: String) -> Request {
        let request_string = "{  
            \"channel_id\":\"ddbbe807-8560-4bc7-b04b-4b3b04c69339\",
            \"channel_name\":\"test;back;door\",
            \"event_name\":\"Crossed line\",
            \"event_origin\":\"Pedestrian\",
            \"event_time\":\""
            .to_owned()
            + &time
            + "\",
            \"event_type\":\"TripwireCrossed\",
            \"object_id\":9,
            \"rule_id\":\"471fa55d-967b-46a7-b77f-5b9ce6af82ee\",
            \"rule_name\":\"Enter\"
         }";

        serde_json::from_str(&request_string).unwrap()
    }

    fn spawn_service_and_get_address(credentials: Credentials) -> SocketAddr {
        let listener = TcpListener::bind("127.0.0.1:0".parse::<SocketAddr>().unwrap()).unwrap();
        let addr = listener.local_addr().unwrap();

        tokio::spawn(async move {
            axum::Server::from_tcp(listener)
                .unwrap()
                .serve(app(credentials).into_make_service())
                .await
                .unwrap();
        });
        addr
    }
}
