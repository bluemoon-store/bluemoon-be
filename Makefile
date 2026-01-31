ssh:
	cd .. && ssh -i "jinx-to-uty.pem" ubuntu@ec2-15-134-132-167.ap-southeast-2.compute.amazonaws.com

deploy:
	git pull origin main
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	sleep 5
	curl -f http://localhost:3001/health

quick-deploy:
	git pull origin main
	docker-compose restart server

logs:
	docker logs nestjs-app -f

status:
	docker ps
	curl http://localhost:3001/health

.PHONY: ssh deploy quick-deploy logs status
