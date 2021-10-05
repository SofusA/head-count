#! /bin/bash

toolbox --container gcloud run npx tsc
toolbox --container gcloud run gcloud run deploy count --source=. --project=iot-lab-308513 --region=europe-west1 --allow-unauthenticated
