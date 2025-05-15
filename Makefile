up:
	docker compose -f docker-compose.yml up --build

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

test:
	docker compose -f docker-compose.yml -f docker-compose.test.yml up --build

down:
	docker compose down
	
