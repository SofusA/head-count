#[cfg(test)]
mod tests {
    use std::net::{SocketAddr, TcpListener};

    use axum::{body::Body, http::Request};
    use sensor_lib::{app::app, models::CounterRequest};

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

    #[tokio::test]
    async fn health_check_test() {
        let listener = TcpListener::bind("127.0.0.1:8000".parse::<SocketAddr>().unwrap()).unwrap();
        let addr = listener.local_addr().unwrap();

        tokio::spawn(async move {
            axum::Server::from_tcp(listener)
                .unwrap()
                .serve(app().into_make_service())
                .await
                .unwrap();
        });

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
}
