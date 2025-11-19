pipeline {
    agent any
    
    stages {
        stage('Install') {
            steps {
                sh 'npm install vite --save-dev'
                sh 'rm -rf dist'
            }
        }
        stage('Setup Environment') {
            steps {
                script {
                    // Create .env file with credentials from Jenkins environment/secrets
                    withCredentials([
                        string(credentialsId: 'SUPABASE_URL', variable: 'SUPABASE_URL'),
                        string(credentialsId: 'SUPABASE_ANON_KEY', variable: 'SUPABASE_ANON_KEY')
                    ]) {
                        sh '''
                            echo "VITE_SUPABASE_URL=${SUPABASE_URL}" > .env
                            echo "VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}" >> .env
                            echo ".env file created successfully"
                        '''
                    }
                }
            }
        }
        stage('Build') {
            steps {
                // Use the Jenkins-specific build script
                sh 'pnpm run build:jenkins'
            }
        }
        // Add any other stages you need (test, deploy, etc.)
    }
}