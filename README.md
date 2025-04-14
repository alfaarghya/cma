<div align="center">

# CMA

### Chat Management Application

![Turborepo](https://img.shields.io/badge/Turborepo-%2320232a.svg?style=for-the-badge&logo=Turborepo&logoColor=%EF4444)
![TypeScript](https://img.shields.io/badge/typetscript-%2320232a.svg?style=for-the-badge&logo=typescript&logoColor=%fff)
![React.js](https://img.shields.io/badge/React.js-%2320232a?style=for-the-badge&logo=react&logoColor=316192)
![Next.js](https://img.shields.io/badge/Next.js-%2320232a?style=for-the-badge&logo=next.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-%2320232a?style=for-the-badge&logo=tailwindCSS&logoColor=316192)
![Express.js](https://img.shields.io/badge/express-%2320232a.svg?style=for-the-badge&logo=express&logoColor=%23F7DF1E)
![PostGresSQL](https://img.shields.io/badge/PostgreSQL-%2320232a.svg?style=for-the-badge&logo=postgresql&logoColor=%316192)
![Prisma](https://img.shields.io/badge/Prisma-%2320232a.svg?style=for-the-badge&logo=prisma&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%2320232a?style=for-the-badge&logo=node.js&logoColor=43853D)

 </div>

![cma-architecture](./public/architecture.png)

## Features 🧪

#### 🔐 Authentication

- secure user signin/signup with api routes
- successful signin/signup generate `auth token` that will be store on cookies
- all routes are protected, only register user can access chat, create room, join room etc.
- when user logout all cookies will by default

#### 🗪 Real-time Chat System

- Send and receive messages instantly using WebSocket
- Messages are updated live without needing to refresh

#### 👥 Chat Room Functionality

- Users can create public chat rooms with unique names
- Users can join existing rooms by entering the room name
- Messages are visible to everyone in the room
- Each message shows sender name, timestamp, and message content
- when any user is not present in room, message will store on db

#### 📥 Direct Messaging (inbox)

- Debounced search bar for username search, Users can search for other users by username
- Initiate private one-on-one chats
- DM conversations are private between two users

#### </> Message Formatting

- Support for bold (**text**), italic (_text_) and code(`text`) styles using markdown-like syntax

### Run the App locally 🏃

#### 🛠️ install all dependency

```bash
#install dependency
yarn install
```

#### 🔒 Create .env files

```bash
#db's env
cd packages/db/
cp .env.example .env
cd ../..

#server's env
cd apps/server/
cp .env.example .env
cd ../..
```

#### 🐳 connect the db

```bash
#starting the postgres db with docker
docker run --name cmaDB -e POSTGRES_PASSWORD=cmaappadminpassward -p 5432:5432 -d postgres

#migrate db
yarn run db:migrate

#generate client
yarn run db:generate

#optional - show the actual db
yarn run db:show
```

#### 🏃 run all applications

```bash
yarn run dev
```

Now visit the website `localhost:3000`

#### 🔬 **optional** - some predefined credentials for login & testing

```bash
#user 1
username: alice
password: password123

#user 2
username: bob
password: password456

#user 3
username: charlie
password: password789
```

## Demos

#### 1. Landing Page

![chat-app](./public/chat-app-demo.png)

#### 2. Sign up page

![signup-1](./public/signup-1.png)
![signup-1](./public/signup-2.png)

#### 3. Sign in page

![signin](./public/signin.png)

#### 4. Chat page

![chat](./public/chat.png)

#### 5. create room page

![create-room](./public/create-room.png)

#### 6. join room page

![join-room](./public/join-room.png)

#### 7. room chat page

![room-chat](./public/room-chat.png)

#### 8. Search by username

![search](./public/search-user.png)

#### 9. inbox chat

![inbox-chat](./public/inbox-chat.png)
