.PHONY: install run stop logs

install:
	pip install -r requirements.txt

run:
	@if [ ! -f .env ]; then echo "❌ Copy .env.example to .env and add your API keys first"; exit 1; fi
	@export $$(cat .env | grep -v '^#' | xargs) && python main.py

# Run in background with nohup
start:
	@if [ ! -f .env ]; then echo "❌ Copy .env.example to .env and add your API keys first"; exit 1; fi
	@export $$(cat .env | grep -v '^#' | xargs) && nohup python main.py > hermes.log 2>&1 & echo $$! > hermes.pid
	@echo "✅ Hermes started (PID $$(cat hermes.pid)) → http://localhost:7777"

stop:
	@if [ -f hermes.pid ]; then kill $$(cat hermes.pid) && rm hermes.pid && echo "Stopped."; else echo "Not running."; fi

logs:
	@tail -f hermes.log
