.PHONY: build run down ps logs

COMPOSE := docker compose --project-name phm_maturity_assessment --env-file docker/.env -f docker/docker-compose.yaml

build:
	$(COMPOSE) build

run:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f app
