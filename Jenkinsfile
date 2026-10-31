pipeline {
    agent any

    parameters {
        choice(name: 'COMPONENT', choices: ['all', 'backend', 'frontend'], description: 'Which part of the application to build and deploy')
        choice(name: 'PROFILE', choices: ['stage', 'prod', 'migration-test'], description: 'Target environment (migration-test applies to backend only)')
    }

    tools {
        maven 'maven'
        jdk 'jdk25'
        nodejs 'NodeJS_24'
    }

    environment {
        APP_NAME        = "camper_park"
        SPRING_PROFILE  = "${params.PROFILE}"

        // Backend
        EXTERNAL_PORT   = "${params.PROFILE == 'prod' ? '2000' : '2001'}"
        LOCAL_PATH      = "/var/www/backend/camper_park_v2-${params.PROFILE}"
        DB_NAME         = "camper_park_${params.PROFILE}"
        DUMPS_DIR       = "/home/camper_park/backups"
        NOVU_SERVER_URL = "http://api:3000"

        // Frontend
        TARGET_DIR      = "/var/www/html/parceo/${params.PROFILE}"
    }

    stages {
        stage('Initialize') {
            steps {
                sh '''
                    echo "Component: ${COMPONENT}"
                    echo "Environment: ${SPRING_PROFILE}"
                    java --version
                    mvn --version
                    node --version
                    npm --version
                '''
            }
        }

        // ---------- Backend ----------

        stage('Backend: Build') {
            when { expression { params.COMPONENT in ['all', 'backend'] } }
            steps {
                dir('backend') {
                    // Hardcoded profile forces Spring to use application-prod.properties
                    sh "mvn clean package -DskipTests -Dspring.profiles.active=prod"
                }
            }
        }

        stage('Backend: Prepare Migration Dump') {
            when {
                allOf {
                    expression { params.COMPONENT in ['all', 'backend'] }
                    expression { params.PROFILE == 'migration-test' }
                }
            }
            steps {
                script {
                    def latestFolder = sh(
                        script: """
                            ls -1 ${DUMPS_DIR} | \
                            grep -E '^[0-9]{2}-[0-9]{2}-[0-9]{4}_[0-9]{2}-[0-9]{2}-[0-9]{2}\$' | \
                            awk -F'[-_]' '{print \$3\$2\$1\$4\$5\$6 \" \" \$0}' | \
                            sort -rn | head -n 1 | cut -d' ' -f2-
                        """,
                        returnStdout: true
                    ).trim()

                    if (latestFolder == "") {
                        error "No backup folder found in ${DUMPS_DIR}!"
                    }

                    def latestFile = sh(
                        script: "ls ${DUMPS_DIR}/${latestFolder}/*.sql.gz | head -n 1",
                        returnStdout: true
                    ).trim()

                    if (latestFile == "") {
                        error "No .sql.gz file found in folder ${latestFolder}!"
                    }

                    env.DB_DUMP_SOURCE = latestFile
                    echo "Selected dump file: ${env.DB_DUMP_SOURCE}"
                }
            }
        }

        stage('Backend: Deploy (Docker Compose)') {
            when { expression { params.COMPONENT in ['all', 'backend'] } }
            steps {
                dir('backend') {
                    withCredentials([
                        usernamePassword(credentialsId: "camper_park_db_${SPRING_PROFILE}", passwordVariable: 'DB_PASSWORD', usernameVariable: 'DB_USER'),
                        string(credentialsId: "${SPRING_PROFILE}-db-root-pass", variable: 'DB_ROOT_PASSWORD'),
                        file(credentialsId: "${SPRING_PROFILE}-camper_park_RSA_private-key", variable: 'RSA_FILE'),
                        file(credentialsId: "${SPRING_PROFILE}-camper_park-RSA-key", variable: 'RSA_PUB_FILE'),
                        string(credentialsId: "novu_api_key", variable: 'NOVU_SECRET_KEY')
                    ]) {
                        sh '''
                            # Default backup for prod/stage when DB_DUMP_SOURCE is not set
                            export DB_DUMP_SOURCE=${DB_DUMP_SOURCE:-"/home/kacper/database_backup/2026-05-24_12-00-01/2026-05-24_12-00-01-camper_park.sql.gz"}

                            export RSA_PRIVATE_PATH=$RSA_FILE
                            export RSA_PUBLIC_PATH=$RSA_PUB_FILE

                            echo "Managing environment with Docker Compose..."

                            docker compose -p "camper-park-${SPRING_PROFILE}" -f compose-prod.yaml down
                            docker compose -p "camper-park-${SPRING_PROFILE}" -f compose-prod.yaml up --build -d
                        '''
                    }
                }
            }
        }

        // ---------- Frontend ----------

        stage('Frontend: Build') {
            when {
                allOf {
                    expression { params.COMPONENT in ['all', 'frontend'] }
                    expression { params.PROFILE in ['stage', 'prod'] }
                }
            }
            steps {
                dir('frontend') {
                    sh '''
                        npm install
                        npm run build
                    '''
                }
            }
        }

        stage('Frontend: Deploy') {
            when {
                allOf {
                    expression { params.COMPONENT in ['all', 'frontend'] }
                    expression { params.PROFILE in ['stage', 'prod'] }
                }
            }
            steps {
                dir('frontend') {
                    sh """
                        mkdir -p ${TARGET_DIR}
                        rm -rf ${TARGET_DIR}/*
                        cp -r dist/browser/* ${TARGET_DIR}/
                    """
                }
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f || true'
            cleanWs()
        }
        success {
            echo "Deployed '${params.COMPONENT}' to environment ${params.PROFILE}."
        }
        failure {
            echo "Deployment failed. Check the Jenkins logs."
        }
    }
}
