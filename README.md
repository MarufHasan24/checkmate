# Checkmate: A Visual Editor for Administering Competitions

## 📌 Project Overview

This is a web-based application designed for organizing and managing Wikipedia Editathons. It enables users to submit their edits, while judges can review and evaluate contributions.

## 🚀 Features

- **User Submission**: Participants submit Wikipedia edits for review.
- **Judging System**: Admins and judges assess submissions.
- **Dashboard**: Displays editathon details, participant stats, and results.
- **Automated Processing**: Utilizes scripts for handling edits and evaluating submissions.
- **Admin Controls**: Includes authentication, permission settings, and admin panel.

---

## Issues

If you encounter any issues or have feedback, please open an issue on the [GitHub](https://github.com/MarufHasan24/checkmate/issues) issue tracker.

## Author

Checkmate was created by [[Md. Maruf Hasan](https://bn.wikipedia.org/wiki/ব্যবহারকারী:Maruf)]. You can contact me on my [Talk page](https://meta.wikimedia.org/wiki/User_talk:Maruf) for any questions or feedback.

## Acknowledgments

Checkmate was inspired by various open-source projects and tools. Thank you to the open-source community for making this project possible!

## 🛠️ Setup Instructions

### 📌 Prerequisites

Ensure you have the following installed:

- Node.js (v18+ recommended)
- npm (Node Package Manager)
- EJS (Embedded JavaScript templating engine)
- JSON based database system

### 🔧 Installation

```sh
# Clone the repository
git clone https://github.com/MarufHasan24/checkmate.git
cd checkmate

# Install dependencies
npm install
```

### 🏃 Running the Application

```sh
# Start the server
npm start

# Or run in development mode with nodemon
npm run dev
```

The application will be accessible at `http://localhost:8000` (or your configured port).

---

## 📂 Project Structure

```
├── public/               # Static assets
│   ├── lib/              # JavaScript libraries
│   ├── bot.js            # Bot for handling cleanup tasks (under construction)
│   ├── mwiki.js          # Wikipedia API wrapper
│   ├── node.js           # Server-side script
├── views/                # Frontend templates
│   ├── assets/           # Static assets (CSS, JS, Images)
│   ├── admin.ejs         # Admin panel template
│   ├── admin.log.ejs     # Admin login page
│   ├── admin.permit.ejs  # Admin permissions page
│   ├── background.html   # Background script
│   ├── callback.ejs      # OAuth callback page
│   ├── countdown.html    # Countdown page
│   ├── create.html       # Editathon creation page
│   ├── dashboard.ejs     # User dashboard
│   ├── deletePage.ejs    # Page deletion UI
│   ├── editathon.ejs     # Main Editathon page
│   ├── error.ejs         # Error page
│   ├── favicon.ico       # Site favicon
│   ├── google*.html      # Google site verification
│   ├── index.ejs         # Homepage
│   ├── judge.ejs         # Judge panel
│   ├── list.ejs          # List of submissions
│   ├── message.ejs       # Messaging page
│   ├── result.ejs        # Results display
│   ├── showResult.ejs    # Results overview
│   ├── sitemap.xml       # Sitemap for search engines
│   ├── submit.ejs        # Submission page
│   ├── template.ejs      # Base template
│   ├── underConst.html   # Under construction page
├── .gitignore            # Git ignore file
├── config.json           # Configuration file (hidden for security)
├── package-lock.json     # Package lock file
├── package.json          # Project dependencies
├── server.get.js         # Handles GET requests
├── server.post.js        # Handles POST requests
├── server.js             # Main server script
└── README.md             # Project documentation
```

### 🔍 Notable Files

- `server.js` - Main Express.js server setup.
- `server.get.js` - Handles all GET route logic.
- `server.post.js` - Handles all POST route logic.
- `public/lib/` - Contains JavaScript libraries for client-side functionality.
- `editathon.ejs` - Main page for the editathon, where users can submit edits.
- `admin.ejs` - Admin panel for managing the editathon.
- `judge.js` - Manages evaluation of submitted Wikipedia edits.
- `result.js` - Computes and stores editathon results.
- `sitemap.xml` - Defines the structure for search engine indexing.

---

## 📝 Contribution Guidelines

We welcome contributions! To contribute:

1. **Fork the repository** and create a new branch.
2. Follow the **code style** and add meaningful comments.
3. Submit a **pull request (PR)** with a descriptive summary.
4. Ensure that the code passes tests before merging.

For detailed contribution steps, see [`CONTRIBUTING.md`](CONTRIBUTING.md) (to be created).

---

## 📜 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## ❓ FAQ

### 1️⃣ What does `sitemap.xml` do?

It automatically updates the sitemap for search engines to index the editathon pages efficiently.

### 2️⃣ Why separate `server.get.js` and `server.post.js`?

To keep the API structure clean and maintainable by clearly defining GET (data retrieval) and POST (data submission) requests separately.

### 3️⃣ What is `underConst.html`?

A temporary placeholder page displayed when maintenance is in progress.

### 4️⃣ How does authentication work in this application?

The application uses OAuth-based authentication (via `passport-mediawiki-oauth`) to allow Wikipedia users to log in securely.

### 5️⃣ How can I customize the appearance of the editathon pages?

You can modify the EJS templates located in the `views/` folder. CSS and JS files are stored in `public/assets/` for customization.

### 6️⃣ How do judges evaluate submissions?

Judges log in via the `judge.ejs` panel, where they can review and rate submissions using predefined criteria.

### 7️⃣ Can I deploy this application on a live server?

Yes! You can deploy it using services like **Heroku, Vercel, or a VPS**. Make sure to configure environment variables and database connections appropriately.

---

## 🔗 Related Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express.js Guide](https://expressjs.com/)
- [EJS Templating](https://ejs.co/)

---
