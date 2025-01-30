# Digital Stamping System for Document Authentication

## Project Overview
The **Digital Stamping System** is a full-stack web application designed to replace traditional physical stamps for document authentication. It allows users to upload documents, create and customize digital stamps, apply them to documents, and download the stamped documents. The system ensures efficiency, security, and traceability for individuals, businesses, and organizations.

## Features
### 1. Document Upload and Display
- Supports multiple formats: **PDF, JPEG, PNG**.
- Interactive document canvas with:
  - **Zooming and Panning** for better navigation.
  - **Pagination** for multi-page documents.

### 2. Stamp Creation and Customization
- Users can create **custom stamps** with:
  - **Shapes:** Circle, Rectangle, Oval, Custom.
  - **Colors:** Custom background and text colors.
  - **Text:** Custom messages, company names, serial numbers.
  - **Logos:** Upload and embed logos or images.
  - **Real-time timestamps** for authenticity.
- Stamps are saved in the "My Stamps" library for future use.

### 3. Stamp Placement on Documents
- Users can **drag and drop** or **click-to-place** stamps.
- Real-time preview before finalizing the placement.

### 4. Document Saving and Downloading
- **Save and Store:** Secure storage with metadata for auditing.
- **Download Without Saving:** Direct download of stamped documents.
- **Version Control:** Maintains multiple document versions.

## Technology Stack
### Front-End:
- **React.js** (for UI and interactivity)
- **Tailwind CSS** (for styling)
- **Konva.js** (for canvas-based interactions)

### Back-End:
- **Django & Django REST Framework** (API development)
- **PostgreSQL** (Database)
- **JWT Authentication** (for secure user authentication)


## Installation and Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Sarenii/digital-stamping-system.git
cd digital-stamping-system
```

### 2. Backend Setup (Django)
#### a) Create and Activate a Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### b) Install Dependencies
```bash
pip install -r requirements.txt
```

#### c) Set Up the Database
```bash
python manage.py makemigrations
python manage.py migrate
```

#### d) Create a Superuser (for Admin Panel)
```bash
python manage.py createsuperuser
```

#### e) Run the Development Server
```bash
python manage.py runserver
```
Backend will be available at `http://127.0.0.1:8000/`

### 3. Frontend Setup (React.js)
#### a) Navigate to Frontend Directory
```bash
cd frontend
```

#### b) Install Dependencies
```bash
npm install
```

#### c) Start the Development Server
```bash
npm start
```
Frontend will be available at `http://localhost:3000/`

## API Endpoints

### Authentication (Auths App)
- `POST /auth/register/` - Register a new user.
- `POST /auth/login/` - Login user and return JWT token.

### Stamps (Stamps App)
- `GET /stamps/stamps/` - List all stamps.
- `POST /stamps/stamps/` - Create a new stamp.
- `GET /stamps/stamps/<id>/` - Retrieve a specific stamp.
- `PUT /stamps/stamps/<id>/` - Update a stamp.
- `DELETE /stamps/stamps/<id>/` - Delete a stamp.

### Documents (Stamps App)
- `POST /stamps/documents/` - Upload a document.
- `GET /stamps/documents/` - List user documents.


## Contributing
1. **Fork the repository**
2. **Create a new branch:**
   ```bash
   git checkout -b feature-branch
   ```
3. **Make changes and commit:**
   ```bash
   git commit -m "Added new feature"
   ```
4. **Push to GitHub and open a Pull Request:**
   ```bash
   git push origin feature-branch
   ```

## License
This project is licensed under the **MIT License**.



