------------------------------------------------------------
                      Software Release Notes
------------------------------------------------------------

**Product Name:** RadioIQ  
**Version:** v1.0.0  
**Release Date:** April 05, 2025
**Release Type:** Initial Release 

------------------------------------------------------------
### 1. Overview
------------------------------------------------------------
RadioIQ v1.0.0 is the first official production release of the RadioVision platform. This release enables AI-assisted chest X-ray analysis, diagnostic annotation rendering, and intelligent reporting in a secure, scalable cloud environment designed for radiologist workflows.

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
- Release Tag: release/v1.0.0

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