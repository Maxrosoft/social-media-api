up:
	docker compose up --build

dev:
	docker compose -f docker-compose.yml -f docker-compose.override.yml up --build

test:
	docker compose run --rm gateway npm test
	docker compose run --rm auth npm test
	docker compose run --rm post npm test
	docker compose run --rm user npm test
	docker compose run --rm comment npm test
	docker compose run --rm feed npm test
	docker compose run --rm like-reaction npm test
	docker compose run --rm notification npm test
	docker compose run --rm search npm test
	docker compose run --rm bookmark npm test
	docker compose run --rm moderation npm test
	docker compose run --rm analytics npm test

down:
	docker compose down
	
