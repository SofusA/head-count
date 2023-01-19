#[macro_use]
extern crate dotenv_codegen;

struct Credentials {
    url: String,
    secret: String,
}

fn get_credentials() -> Credentials {
    let url = dotenv!("DATABASE_URL").to_string();
    let secret = dotenv!("DATABASE_SECRET").to_string();

    Credentials { url, secret }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sensor::{
        app::app,
        models::{CounterEntry, CounterRequest},
    };
    use std::net::{SocketAddr, TcpListener};

    fn get_test_request() -> CounterRequest {
        let request_string = "{  
            \"channel_id\":\"ddbbe807-8560-4bc7-b04b-4b3b04c69339\",
            \"channel_name\":\"test;back;door\",
            \"event_name\":\"Crossed line\",
            \"event_origin\":\"Pedestrian\",
            \"event_time\":\"2050-01-01T15:00:00+01:00\",
            \"event_type\":\"TripwireCrossed\",
            \"object_id\":9,
            \"rule_id\":\"471fa55d-967b-46a7-b77f-5b9ce6af82ee\",
            \"rule_name\":\"Enter\"
         }";

        serde_json::from_str(request_string).unwrap()
    }

    fn spawn_service_and_get_address(endpoint: &str) -> String {
        let listener = TcpListener::bind("127.0.0.1:0".parse::<SocketAddr>().unwrap()).unwrap();
        let addr = listener.local_addr().unwrap();

        let credentials = get_credentials();

        tokio::spawn(async move {
            axum::Server::from_tcp(listener)
                .unwrap()
                .serve(
                    app(
                        credentials.url,
                        credentials.secret,
                        "count_test".to_string(),
                        "sensor_test".to_string(),
                    )
                    .into_make_service(),
                )
                .await
                .unwrap();
        });

        format!("http://{}/{}", addr, endpoint)
    }

    #[tokio::test]
    async fn health_check_test() {
        let endpoint = spawn_service_and_get_address("health");
        let resp: String = reqwest::get(endpoint).await.unwrap().text().await.unwrap();

        assert_eq!(resp, "All good");
    }

    #[tokio::test]
    async fn smoke_test() {
        let endpoint = spawn_service_and_get_address("smoke");

        let request = get_test_request();
        let serialised_request = serde_json::to_string(&request).unwrap();

        let client = reqwest::Client::new();
        let resp: CounterEntry = client
            .post(endpoint)
            .header("Content-Type", "application/json")
            .body(serialised_request.clone())
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();

        println!("{:?}", resp);

        let expected_entry = request.to_entry().unwrap();

        assert!(expected_entry == resp);
    }
}
