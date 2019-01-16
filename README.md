# Vevey

## Development
```sh
docker-compose run --service-ports --rm dev
```

## Deploy
```sh
cd prod && terraform get -update && terraform apply
```
