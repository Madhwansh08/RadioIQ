build:
	@docker compose build

start:
	@docker compose up

stop:
	@docker compose down

.PHONY: pytest

pytest:
	@docker compose exec server pytest -v -s $(PYTEST_ARGS)

install-jupyter:
	docker compose exec server pip install jupyter

run-jupyter:
	docker compose exec server jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root

get-token:
	docker compose exec server jupyter notebook list

run-jupyter-bg:
	docker compose exec server nohup jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root > /tmp/jupyter.log 2>&1 &

logs:
	docker compose exec server tail -f /tmp/jupyter.log
