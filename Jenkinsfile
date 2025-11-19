pipeline {
    agent any
    
    environment {
        // Set npm prefix to local directory to avoid permission issues
        npm_config_prefix = "${WORKSPACE}/.npm-global"
    }
    
    stages {
        stage('Install') {
            steps {
                sh 'npm install'
                sh 'rm -rf dist'
            }
        }
        stage('Setup Environment') {
            steps {
                script {
                    // Try to create .env file with credentials from Jenkins environment/secrets
                    // If credentials don't exist, use environment variables or skip
                    try {
                        withCredentials([
                            string(credentialsId: 'SUPABASE_URL', variable: 'SUPABASE_URL'),
                            string(credentialsId: 'SUPABASE_ANON_KEY', variable: 'SUPABASE_ANON_KEY')
                        ]) {
                            sh '''
                                echo "VITE_SUPABASE_URL=${SUPABASE_URL}" > .env
                                echo "VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}" >> .env
                                echo ".env file created successfully from Jenkins credentials"
                            '''
                        }
                    } catch (Exception e) {
                        echo "Warning: Jenkins credentials not found. Checking for environment variables..."
                        sh '''
                            if [ -n "$VITE_SUPABASE_URL" ] && [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
                                echo "VITE_SUPABASE_URL=${VITE_SUPABASE_URL}" > .env
                                echo "VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}" >> .env
                                echo ".env file created from environment variables"
                            else
                                echo "Warning: No Supabase credentials found. Build may fail if .env is required."
                                echo "Please add SUPABASE_URL and SUPABASE_ANON_KEY credentials in Jenkins"
                            fi
                        '''
                    }
                }
            }
        }
        stage('Build') {
            steps {
                // Use the Jenkins-specific build script
                sh 'npm run build:jenkins'
            }
        }
    }
}