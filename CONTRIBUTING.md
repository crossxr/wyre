# Contributing to Wyre

Thank you for your interest in contributing to Wyre! We welcome contributions from everyone.

---

## 1. Setup Instructions

Wyre is structured as a monorepo consisting of:
- **Go Web Engine**: Core Go files at the repository root.
- **Landing Page & Docs**: Next.js website located inside the `web/wyre-nextjs/` subdirectory.

### Go Development
Ensure you have Go installed (version 1.21 or higher is recommended).

1. Clone the repository:
   ```bash
   git clone https://github.com/crossxr/wyre.git
   cd wyre
   ```
2. Run the tests to confirm your local environment is sound:
   ```bash
   go test ./...
   ```

### Website Development
The landing page and documentation site is built with Next.js.

1. Navigate to the web folder:
   ```bash
   cd web/wyre-nextjs
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 2. Contribution Workflow

1. **Fork the Repository**: Create your own fork of the repository on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/my-amazing-feature
   ```
3. **Make your Changes**: Make sure your code adheres to standard Go guidelines and has proper test coverage.
4. **Compile Documentation** (if editing docs):
   If you add or update markdown docs in the `/docs` folder, run the compilation script in `web/wyre-nextjs` to update the Next.js database:
   ```bash
   node scripts/compile-docs.js
   ```
5. **Run the Test Suite**:
   ```bash
   go test -v ./...
   ```
6. **Commit & Push**: Commit your changes and push them to your fork.
7. **Create a Pull Request**: Submit a Pull Request from your branch to the main repository.

---

## 3. Reporting Issues

If you find a bug or have a feature request, please search existing issues first. If it has not been reported yet, feel free to open a new GitHub Issue outlining:
- The behavior you observed.
- The expected behavior.
- Steps or a minimal code example to reproduce.
