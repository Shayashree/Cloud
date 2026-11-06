pipeline {
    agent any

    environment {
        DOCKER_REGISTRY  = credentials('DOCKER_REGISTRY')   // e.g. docker.io/yourusername
        DOCKER_CREDS     = credentials('docker-hub-creds')  // Jenkins secret (username/password)
        IMAGE_TAG        = "${BUILD_NUMBER}"
        KUBECONFIG_FILE  = credentials('kubeconfig')        // Jenkins secret file
    }

    stages {

        // ── Stage 1: Checkout ─────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code checked out — branch: ${env.GIT_BRANCH}, commit: ${env.GIT_COMMIT.take(7)}"
            }
        }

        // ── Stage 2: Install & Lint ───────────────────────────────────────
        stage('Install & Lint') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run lint'
                        }
                    }
                }
            }
        }

        // ── Stage 3: Docker Build ─────────────────────────────────────────
        stage('Docker Build') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        sh """
                            docker build -t ${DOCKER_REGISTRY}/taskflow-backend:${IMAGE_TAG} \
                                         -t ${DOCKER_REGISTRY}/taskflow-backend:latest \
                                         ./backend
                        """
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        sh """
                            docker build -t ${DOCKER_REGISTRY}/taskflow-frontend:${IMAGE_TAG} \
                                         -t ${DOCKER_REGISTRY}/taskflow-frontend:latest \
                                         ./frontend
                        """
                    }
                }
            }
        }

        // ── Stage 4: Docker Push ──────────────────────────────────────────
        stage('Docker Push') {
            steps {
                sh "echo ${DOCKER_CREDS_PSW} | docker login -u ${DOCKER_CREDS_USR} --password-stdin"
                sh """
                    docker push ${DOCKER_REGISTRY}/taskflow-backend:${IMAGE_TAG}
                    docker push ${DOCKER_REGISTRY}/taskflow-backend:latest
                    docker push ${DOCKER_REGISTRY}/taskflow-frontend:${IMAGE_TAG}
                    docker push ${DOCKER_REGISTRY}/taskflow-frontend:latest
                """
            }
        }

        // ── Stage 5: Deploy to Kubernetes ─────────────────────────────────
        stage('Deploy to K8s') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    sh """
                        # Substitute image tag in manifests
                        sed -i 's|\${DOCKER_REGISTRY}|'${DOCKER_REGISTRY}'|g; s|\${IMAGE_TAG}|'${IMAGE_TAG}'|g' k8s/backend-deployment.yaml k8s/frontend-deployment.yaml

                        kubectl apply -f k8s/mongo-deployment.yaml
                        kubectl apply -f k8s/backend-deployment.yaml
                        kubectl apply -f k8s/frontend-deployment.yaml
                        kubectl apply -f k8s/prometheus-deployment.yaml
                        kubectl apply -f k8s/grafana-deployment.yaml

                        kubectl rollout status deployment/backend  --timeout=120s
                        kubectl rollout status deployment/frontend --timeout=120s

                        echo "🚀 Deployment complete — build #${IMAGE_TAG}"
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline SUCCESS — TaskFlow build #${BUILD_NUMBER} deployed"
        }
        failure {
            echo "❌ Pipeline FAILED — check logs above"
        }
        always {
            sh "docker logout || true"
            cleanWs()
        }
    }
}
