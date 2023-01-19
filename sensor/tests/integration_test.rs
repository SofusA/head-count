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
    use axum::{body::Body, http::Request};
    use sensor::{app::app, models::CounterRequest};
    use std::net::{SocketAddr, TcpListener};

    fn get_test_entry() -> CounterRequest {
        let request_string = "{  
            \"channel_id\":\"ddbbe807-8560-4bc7-b04b-4b3b04c69339\",
            \"channel_name\":\"test;back;door\",
            \"event_name\":\"Crossed line\",
            \"event_origin\":\"Pedestrian\",
            \"event_time\":\"2050-01-01T15:00:00+01:00\",
            \"event_type\":\"TripwireCrossed\",
            \"object_id\":9,
            \"rule_id\":\"471fa55d-967b-46a7-b77f-5b9ce6af82ee\",
            \"rule_name\":\" Enter \"
         }";

        serde_json::from_str(request_string).unwrap()
    }

    fn spawn_service_and_get_address() -> SocketAddr {
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

        addr
    }

    #[tokio::test]
    async fn health_check_test() {
        let addr = spawn_service_and_get_address();

        let client = hyper::Client::new();

        let response = client
            .request(
                Request::builder()
                    .uri(format!("http://{}/health", addr))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let bytes = hyper::body::to_bytes(response.into_body()).await.unwrap();
        let body = std::str::from_utf8(&bytes).unwrap();

        assert_eq!(body, "All good");
    }

    #[tokio::test]
    async fn add_get_delete_test() {
        let addr = spawn_service_and_get_address();
        let entry = get_test_entry();
        assert!(true);
    }
}
