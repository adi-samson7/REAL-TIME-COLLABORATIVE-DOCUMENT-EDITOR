REAL TIME COLLABORATIVE DOCUMENT EDITOR - Realtime DocEditor

COMPANY: CODTECH IT SOLUTIONS

NAME: Aditya Samson

INTERN ID: CT08DL961

DOMAIN: FULL STACK WEB DEVELOPMENT

BATCH DURATION: May 20th, 2025 to July 20th, 2025

MENTOR NAME : NEELA SANTHOSH KUMAR

DESCRIPTION OF TASK PERFORMED :

Realtime DocEditor is a full-stack, real-time collaborative document editing application inspired by platforms like Google Docs. It enables multiple users to collaboratively create, edit, and manage rich-text documents in real-time, with synchronized updates across all connected clients. The application supports user authentication, room-based document collaboration, online user tracking, and document export functionality.

Built using the MERN stack (MongoDB, Express.js, React, and Node.js), it leverages Socket.IO for real-time communication and Quill.js for the rich text editing experience.

<img width="1920" height="1022" alt="Screenshot 2025-07-20 164315" src="https://github.com/user-attachments/assets/9da41e93-29a5-4d30-b347-63bf374c0cb0" />
<img width="1920" height="1018" alt="Screenshot 2025-07-20 164254" src="https://github.com/user-attachments/assets/a35bd740-584c-4716-908b-ee39a380eece" />


Features

1. Real-time Collaboration

Multiple users can join the same document room and collaborate simultaneously. As users type or format text, changes are broadcast instantly to all other participants using WebSocket connections via Socket.IO.

2. Room-based Document Editing

Each document is associated with a unique Room ID. Users can share this ID to invite others into a live editing session. This makes the platform ideal for teamwork, collaborative note-taking, or pair programming.

3. User Authentication

The application supports JWT-based user login and registration, ensuring that only authenticated users can access document rooms. This adds a layer of privacy and identity verification to collaborative sessions.

4. Online User Tracking

A sidebar displays all users currently active in a room. This allows users to see who they are collaborating with in real-time, including dynamic updates when users join or leave the session.

5. Document Persistence

Edits are not only transmitted in real time but are also periodically saved to a MongoDB database. This ensures that document changes are not lost and can be restored later if users refresh or leave the page.

6. Word Export Support

Users can export the collaborative document in .docx (Microsoft Word) format using the docx and file-saver libraries. This feature supports basic formatting (bold, italic, underline) and embedded images.

7. Rich Text Editing

The frontend uses Quill.js, a powerful WYSIWYG editor that supports:

Headings and fonts, 
Bold, italic, underline,
Lists (ordered, bullet),
Colors and highlights,
Code blocks and quotes,
Image embedding

Technologies Used

Frontend:

1. React

2. Quill.js

3. Axios

4. React Router

5. Socket.IO Client

6. FileSaver + docx (for downloads)

Backend:

1. Node.js

2. Express.js

3. MongoDB + Mongoose

4. Socket.IO

5. JWT for authentication

6. bcrypt for password hashing

How It Works:

Users register or log in to the platform.
After logging in, they are directed to a room management page.
A user can either create a new room (generating a unique ID) or join an existing room using a shared Room ID.
Once inside the room, they are connected via Socket.IO.
Document content is loaded from the database or initialized fresh.
As users type, changes are broadcast to everyone in the room and saved periodically.
Users can leave the room, log out, or download the document as a .docx file.

Installation & Setup:

NODE MODULES:

cd client

npm install

CLIENT DEPENDENCIES:

npm install axios socket.io-client quill file-saver docx react-router-dom

cd server

npm install

SERVER DEPENDENCIES:

npm install express socket.io cors mongoose jsonwebtoken bcrypt quill-delta


npm init -y [in both folders]



STARTUP:

IN TERMINAL:

cd client

npm install

npm start

IN A NEW TERMINAL:

cd server

npm install

node server.js

IN A NEW TERMINAL:

mongod


OUTPUT:

<img width="1920" height="1018" alt="Screenshot 2025-07-20 164254" src="https://github.com/user-attachments/assets/01c91c91-cb3e-4a0c-93fb-1d921c8083af" />


<img width="1920" height="1020" alt="Screenshot 2025-07-20 164416" src="https://github.com/user-attachments/assets/2cc16ddd-db1e-4501-97c0-a73e4bed2341" />
<img width="1920" height="1017" alt="Screenshot 2025-07-20 164404" src="https://github.com/user-attachments/assets/7287f8cd-adfd-4ed1-84d4-d8aff5b79622" />

<img width="1920" height="1020" alt="Screenshot 2025-07-20 164354" src="https://github.com/user-attachments/assets/afc4d83f-f400-434a-89df-4ebb7a71f05a" />
<img width="1564" height="776" alt="Screenshot 2025-07-20 164906" src="https://github.com/user-attachments/assets/2946120a-577c-4a47-9d64-a01ca74462e2" />
<img width="1920" height="1022" alt="Screenshot 2025-07-20 164315" src="https://github.com/user-attachments/assets/77217301-6328-4fa3-b088-f1a51b3974ba" />
<img width="1920" height="1020" alt="Screenshot 2025-07-20 164541" src="https://github.com/user-attachments/assets/dc1e87b4-68a3-4936-8815-957d3714b93c" />
