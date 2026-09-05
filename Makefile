.PHONY: all demo reset-demo ui-verify verify submission-audit deploy smoke

demo:
	@echo "Starting Demo Environment..."
	@npm run dev &
	@.venv/bin/uvicorn backend.main:app --reload --port 8000 &
	@echo "Demo ready at http://localhost:3000"

reset-demo:
	@echo "Resetting Demo State..."
	@rm -rf backend/.clickhouse_data
	@echo "Demo state reset complete."

ui-verify:
	@echo "Verifying UI Build..."
	@npm run build

verify:
	@echo "Running System Verification Tests..."
	@PYTHONPATH=. python3 -m pytest backend/tests/

submission-audit:
	@echo "Running Hackathon Submission Audit..."
	@npm run lint
	@python3 -m flake8 backend/
	@python3 scripts/check-ai-compliance.py

deploy:
	@echo "Deploying to Google Cloud Run..."
	@gcloud builds submit --config cloudbuild.yaml .

smoke:
	@echo "Running Smoke Tests on Deployment..."
	@python3 simulator/generate.py
	@python3 tests/evaluation/score_run.py
