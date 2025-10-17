pipeline {
    agent any
    
    stages {
        stage('Install') {
            steps {
                sh 'npm install vite --save-dev'
                sh 'rm -rf dist'
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