.PHONY: up down logs rebuild

up:
	docker compose --env-file backend/.env up -d --build --remove-orphans

down:
	docker compose --env-file backend/.env down

logs:
	docker compose --env-file backend/.env logs -f

rebuild:
	docker compose --env-file backend/.env up -d --build --force-recreate --remove-orphans