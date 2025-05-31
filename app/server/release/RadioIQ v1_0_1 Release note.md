------------------------------------------------------------
                      Software Release Notes
------------------------------------------------------------

**Product Name:** RadioIQ  
**Version:** v1.0.1  
**Release Date:** April 18, 2025  
**Release Type:** First Patch

------------------------------------------------------------
### 1. Overview
------------------------------------------------------------
RadioIQ v1.0.1 is the first patch update for the RadioIQ platform. This release includes minor UI updates, improvements for preprocessing DICOM files, and enhancements for responsive UI pages. These changes aim to improve the overall user experience and functionality for radiologists.

------------------------------------------------------------
 ### 2. Key Features
------------------------------------------------------------
- Upload and view chest X-ray images (DICOM and PNG formats)
- Real-time AI inference for detection and segmentation
- Interactive annotation editing and report generation
- Heatmap rendering for abnormality explainability
- Multiple transformed images for analysis
- Time-based comparisons of patient scans for monitoring disease progression
- Multi-format reporting tailored for clinical and patient communication
- Comprehensive dashboard for analytics and X-ray records

#### 2.1 First Patch Updates
- Minor UI updates for improved user experience
- Preprocessing of DICOM files to ensure smoother integration and analysis
- Responsive UI pages optimized for multiple devices and screen sizes

------------------------------------------------------------
### 3. Known Issues
------------------------------------------------------------
- No major functional defects or blocking issues remain at the time of release.

------------------------------------------------------------
### 4. Risks Mitigated
------------------------------------------------------------
- Input validation and API security enhancements implemented
- Session management hardened with token expiration policies
- Least privilege IAM policies applied across AWS components

------------------------------------------------------------
### 5. Release Artifacts
------------------------------------------------------------
- Frontend Build: React.js (Vite) deployed via AWS S3 and CloudFront  
- Backend Services: Node.js (Express) and Django APIs containerized via Docker on AWS EC2  
- AI Model Hosting: Deployed on AWS SageMaker Endpoints  
- Release Tag: release/v1.0.1

------------------------------------------------------------
### 6. Technology Stack
------------------------------------------------------------
- Frontend: React.js (Vite)  
- Backend: Node.js (Express), Django (Python 3.11)  
- Database: MongoDB Atlas (Cloud-hosted)  
- Storage: AWS S3 + Redis  
- Hosting Environment: AWS EC2 (Ubuntu 22.04), CloudFront  
- Load Balancer & Routing: AWS Application Load Balancer (ALB) + Nginx  
- AI Inference Engine: Amazon SageMaker

------------------------------------------------------------
### 7. Contributors
------------------------------------------------------------
NuvoAI Private Limited