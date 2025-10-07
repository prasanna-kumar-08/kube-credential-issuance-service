# Kube Credential - Credential Issuance Service

## Description
This service is responsible for issuing credentials as JSON objects. It accepts a credential JSON via its API, checks if it has already been issued, and if not, issues it. Each successful issuance responds with the worker (pod) ID that handled the request.

The service is implemented in Node.js with TypeScript, uses SQLite for persistence, and is containerized with Docker for cloud deployment. It is designed as a microservice, independently scalable, and documented as per the assignment requirements.

## Features
- Issue credentials if not already issued
- Return a message if the credential was already issued
- JSON-based API input/output
- Uses SQLite for storage
- Independent microservice deployable with Kubernetes manifests

## Setup Instructions
1. Clone the repository
2. Run `npm install` to install dependencies
3. Build the TypeScript code: `npm run build`
4. Start the API: `npm start`
5. The service listens on port 3000 by default
6. Dockerfile is provided for containerization
7. Kubernetes manifests are included under `/k8s`

## Assumptions
- Uses a simple SQLite database for persistence
- Microservice communicates via REST JSON API

