Scaffold a new monorepo project. 

 

ProjectName: agentCourses 

ProjectCode: axc 

PackageManager: pnpm 

License: MIT 

 

Primary goal: 

Create a scaffold for a “dark software factory” where coding agents build functionality in isolated git worktrees; every output passes automated quality, architecture, security, and BDD gates.  

 

Purpose: 

agentCourses exists to quantify how harness engineering, agentic coding harnesses, and model selection affect software quality and delivery efficiency.  

 

The initial scaffold must establish the architecture, local developer workflow, agent workflow, quality gates, security gates, BDD validation, and a minimal healthcheck feature. Do not overbuild the full product domain yet; include clear extension points for future functionality. 

 

Reference/architecture source of truth: 

Use the local CellixJs/cellixjs repository at /Volumes/files/src/cellixjs as the authoritative reference for architecture, framework conventions, package structure, testing patterns, and reusable infrastructure. Prefer reusing or porting existing Cellix packages and established patterns over recreating equivalent functionality inside agentCourses. When Cellix already provides a reusable framework capability, use it rather than implementing an application-specific equivalent (for example, use @cellix/api-core for the API bootstrap/lifecycle). 


Leverage these pre-installed tools: 

- pnpm >11 (no use of npm or yarn, do not allow scripts) 

- nvm with NodeJS 24 

- snyk CLI (global) 

- portless (trusted) 

- current JRE version 

 

Runtime/version constraints: 

- Add .nvmrc. 

- Use pnpm workspaces and Turborepo. 

 

Technical Details (specifc npm package guidance): 

* guardrails 

    * biome 

        - linting / formatting 

        - leverage defaults from cellixjs where makes sense 

    * typescript compilation rules 

        - leverage defaults from cellixjs 

    * knip 

        - website: https://knip.dev/ 

        - details: finds and removes unused code and dependencies 

        - installation: pnpm create @knip/config 

    * e18e 

    * husky + lint-staged 

    * archunit 

    * security 

        * snyk 

* organization slug id: agentcourses 

* skip snyk monitor usage from Cellix, local CLI only 

* Ignore --remote-repo-url option 

* local development  

    * portless 

    * mongodb-memory-server-core	 (avoids build scripts) 

* build 

    * rolldown 

* testing 

    * serenityjs + @serenity-js/cucumber + @serenity-js/serenity-bdd 

* deployed runtime 

    * mongodb 

* infrastructure 

    * turborepo 

    * node 24+ / hono 

        - azure function v4 compatibility 

        - pnpm add @marplex/hono-azurefunc-adapter hono 

    * typescript 6.x 

    * mongoose 

 
For any of the guardrails, do note change the settings within them for the code to work, rather form the code to adhere to it, without leaving patterns done in cellixjs. If you find yourself touching a file that has a rule in cellixjs, know that this is an ANTI PATTERN.
 

## Agentic Tooling: 

* MCPs 

    * @e18e/mcp 

* Skills 

    * turborepo 

        * pnpm dlx skills add vercel/turborepo 

    * portless 

        * pnpm dlx skills add https://github.com/vercel-labs/portless --skill portless 

    * serenityjs 

        * pnpm dlx skills add serenity-js/serenity-js 

* bothy-board 

  * Docs: https://bothyboard.com/ 

      * MCP: https://bothyboard.com/api/mcp 

      * Skill: https://bothyboard.com/skills/bothy-board/SKILL.md 

      * Install and follow the BothyBoard skill before implementation 

      * Use BothyBoard as the source of truth for implementation task decomposition, dependencies, worktree ownership, progress, handoffs, and completion proofs 

      * Break the scaffold into independently verifiable tasks with explicit done_when criteria before implementation begins 

      * Workers should only implement claimed/ready work and must attach verification evidence before considering work complete 

      * When creating the task board, prioritize parallelism in the structure and scope of these tasks, so multiple sub agents can work on the effort at the same time 

          * Attempt to use multiple workers at the same time when assigning them to tasks, leveraging the parallelism you designed into the tasks 

    When working on the BothyBoard, make sure you are feeding the subagents the tasks from the board, and updating the tasks on the board as you make progress, as that should be the source of truth for progress.

    You should be working on the AgentCourses board, which is the only one you have access to.

 

    

 

## Implementation Specifics: 

 

* Parallel isolated Multi-agent development support 

    * Enable worktrees / turborepo / portless 

* Basic agentic configuration scaffolding  

* Using BDD/Gherkin/Serenity 

    * Prove the healthcheck endpoint works through the actual @apps/api composition path and generate the Serenity HTML report 

    * Acceptance tests must exercise the API over HTTP using the application composed by @apps/api 

    * Do not instantiate @axc/rest, Hono, or application services directly inside acceptance-api as a substitute for the application host. 

    * The tests must prove GET /health through the same bootstrap, routing, and dependency composition used by local/runtime execution. 

    * Leverage @cellix/serenity-framework where applicable when implementing packages/axc-verification/acceptance-api rather than recreating equivalent Serenity test infrastructure. 

 

* Ensure Husky + lint-staged run local pre-commit checks for agent-authored changes. (knip,e18e,biome,typescript compilation,archunit,serenity,pnpm audit,snyk)  

* Create a top-level README.md and MIT standard license 

* Single top-level commands (all fully driven through turborepo) 

    * pnpm run dev 

      * Starts the API locally through portless and supports parallel git worktrees and hot reloading. 

    * pnpm run test 

      * Runs unit/integration tests and Serenity/Cucumber acceptance tests for the healthcheck 

    * pnpm run verify 

      * Runs the full local gate: dependency script policy check, biome, TypeScript compilation, knip, @e18e/cli, architecture tests, tests, Serenity acceptance tests, pnpm audit, and Snyk (if available). 

    * pnpm run build 

      * Leverages rolldown for application logic and creates a zip file compatible with the Azure Functions run from package zip deployment. 

    * pnpm run start 

      * Starts the built API locally in an Azure Functions-compatible or documented local runtime mode. 

* Snyk must be attempted by pnpm run verify. If Snyk cannot run because credentials are unavailable in the scaffolding environment, the command may report Snyk as SKIPPED or NON-BLOCKING for the first scaffold only, but it must not fail silently. The README and verification output must clearly state the reason. 

* Husky + lint-staged should provide local pre-commit feedback, but pnpm run verify and CI are the enforcement boundary. Add a CI workflow that runs pnpm install --frozen-lockfile and pnpm run verify. 

 

 

Required Folder Structure:  

 

/ 

├── apps/                          

|   └── api/                               # composition root: injects dependencies into packages/axc/rest. 

|   └── docs/                              # Docusaurus: API docs MADR/SRTM repository 

├── packages 

    ├── cellix/*                           # CELLIX reusable workspace package (may pull in later) 

	| ├── api-core/ 						  # Reusable API bootstrap/composition; used by @apps/api  

| ├── api-services-spec/ 			  # Shared API/infrastructure service contracts 

| ├── archunit-tests/ 				  # Reusable architectrual fitness tests used by @axc-verification/ 

| ├── config-rolldown/ 				  # Shared Rolldown build configuration 

| ├── config-typescript/ 			  # Shared TypeScript configuration  

| ├── config-vitest/ 				  # Shared Vitest configuration  

| ├── domain-seedwork/ 				  # DDD seedwork used by packages/axc/domain  

| ├── local-dev/ 					  # Shared local development infrastructure and conventions  

| ├── mongoose-seedwork/ 			  # Shared Mongoose context/persistence abstractions used by service-mongoose  

| ├── serenity-framework/ 			  # Shared Serenity/Screenplay framework used by axc-verification/acceptance-api 

| └── server-mongodb-memory-mock-seedwork/ # Shared mongodb-memory-server infrastructure for local/test execution 

    ├── axc-verification/                   

    |   ├── acceptance-api/                # Serenity/Cucumber acceptance tests + report generation 

    |   └── archunit-tests/                # Archunit tests 

    └── axc/  

        ├── application-services/       	  # use cases & orchestration 

        ├── domain/                        # DDD domain logic (See CELLIX for reference details) 

        ├── rest/                          # Hono routing and logic (application-services injected from apps/api) 

        ├── persistence/                   # data related (See CELLIX for reference details) 

        ├── service-mongoose/              # MongodDB/Mongoose related 

        └── README.md                      # workspace related overview documentation 

 

Workspace package rule: 

- packages/cellix/*, packages/axc-verification/*, and packages/axc/* are workspace packages. 

When copying the packages/cellix/* packages over, DO NOT, change ANYTHING in them. They are static, treat them like any other pnpm package we would install into our project.

When working on implementing the api-verification package within axc-verification, ensure that you properly follow the pattern that is done in cellixjs, so fully implementing the infrastructure object we extracted out into the serenity-shared package. Do not deviate or take shortcuts from this pattern.

- The axc layer packages live directly under packages/axc. 

- Each package owns: `package.json`, `tsconfig`, build script, typecheck script, explicit exports where appropriate. 

- Domain packages must not import REST, Hono, Azure Functions, Mongoose, persistence implementations, or composition code. 

- @apps/api is a thin composition root: compose application infrastructure, application services, and REST using the established Cellix framework conventions, injecting dependencies into packages/axc/rest. 

For composing the api package, while our application is a lot simpler, and will not have everything the version with the cellix repo does, it should not differ in structure however, and should be structured the same way that the example is within the cellix repo you will referencing throughout this process, at index.ts specifically within apps/api/src. So do not take shortcuts, or make structural changes that would overall differ, even with the simplicity.

Composition should remain the same, even though it is a simplistic implementation. No renaming or changes of any sort beyond application specific files, similar to how its handled in the cellix repo.

- Required packages may remain minimal when the initial healthcheck does not require their full capabilities. Do not invent placeholder domain, persistence, repository, or infrastructure abstractions solely to make a package appear implemented. Establish the correct extension point and reuse Cellix contracts where applicable. 

 

Functional Success Criteria:  

* Implement healthcheck endpoint 

 

GET /health 

 

Expected 200 response: 

 

{ 

  "status": "ok", 

  "service": "agentCourses-api", 

  "projectCode": "axc", 

  "environment": "<local|test|production>", 

  "timestamp": "<ISO-8601 string>" 

} 



ALL tests that you implement must pass, including arch, serenity, knip, and snyk. This should all be within pnpm run verify, and tested through that script.

Once the work has completed, review the output vs the cellix repo one last time before confirming the work is done, if there is a major difference that goes against the structure in cellix or the details above, even with this simplistic repo, you need to make a new task or tasks depending on scope on the BothyBoard describing the differences, and showing how it should be done instead. Do this only once after completing initial work.

If you notice:
    - Unexpected pattern deviation from cellixjs
    - Rules change in one of the following or similar files at root: tsconfig.json, biome.json
    - File strucrure or names that deviate from cellixjs, even taking into account the simple current scope of this application

That is criteria for failing the success requirements

Reuse this exact contract in: API impl, README, docs site, Serenity feature file, acceptance tests, future task-set validation. 

 
* Documentation website should showcase healthcheck API usage expected results 

* ArchUnit and Serenity tests should prove functionality and structure are implemented properly. 