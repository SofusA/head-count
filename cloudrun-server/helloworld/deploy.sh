#! /bin/bash

toolbox --container gcloud run npx tsc
toolbox --container gcloud run gcloud run deploy
