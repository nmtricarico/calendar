/*
  Surgeon Pathway Tracker

  Current behavior:
  - Landing dashboard, region account list, region dashboard, and editable account page.
  - Phase status is calculated automatically.
  - No phase status dropdown appears on the Account Page.
  - Target date is calculated from phase start date and phase target-day rule.
  - Data tools are available through the gear icon as a pop-up menu.
*/

const STORAGE_KEY = "surgeonPathwayTracker.accounts.v2";

const REGIONS = ["East", "West"];
const OWNERS = ["Simes", "Cirano"];
const STATUS_OPTIONS = ["Not Started", "In Progress", "At-Risk", "Completed"];

const PHASE_TEMPLATES = [
	{
		id: "phase1",
		shortName: "Phase I",
		label: "Technology Exposure / Validation",
		targetDays: 14,
		tasks: [
			"Peer-to-peer event or discussion",
			"Case observation",
			"Identify goals for utilization",
			"Build case-use algorithm"
		]
	},
	{
		id: "phase2",
		shortName: "Phase II",
		label: "Workflow Planning / Case Selection",
		targetDays: 21,
		tasks: [
			"Procedure video review",
			"In-service training",
			"Procedure workflow review",
			"Vision system in-service with applicable camera vendor"
		]
	},
	{
		id: "phase3",
		shortName: "Phase III",
		label: "Initial Case Activation",
		targetDays: 30,
		tasks: ["Initial case series", "Video and dashboard review"]
	},
	{
		id: "phase4",
		shortName: "Phase IV",
		label: "Independent Utilization / Program Growth",
		targetDays: 45,
		tasks: [
			"Full practice education and workflow integration",
			"Advanced case support and/or peer-to-peer",
			"Community awareness activities"
		]
	}
];

let accountFilters = {
	phase: "",
	status: "",
	account: "",
	owner: ""
};

let regionListViewMode = "tiles";

const demoAccounts = [
	{
		id: "acct_001",
		accountName: "Sample University Hospital",
		surgeonName: "Dr. Jane Smith",
		region: "East",
		owner: "Simes",
		nextAction: "Schedule Phase II workflow planning session",
		createdDate: "2026-06-01",
		lastUpdatedDate: "2026-06-26",
		phases: [
			createPhase("phase1", 100, "2026-06-01", "2026-06-12", [
				true,
				true,
				true,
				true
			]),
			createPhase("phase2", 45, "2026-06-16", "", [true, false, false, false]),
			createPhase("phase3", 0, "", "", [false, false]),
			createPhase("phase4", 0, "", "", [false, false, false])
		]
	},
	{
		id: "acct_002",
		accountName: "Regional Hospital East",
		surgeonName: "Dr. Michael Johnson",
		region: "East",
		owner: "Cirano",
		nextAction: "Confirm Phase II training date",
		createdDate: "2026-05-18",
		lastUpdatedDate: "2026-06-24",
		phases: [
			createPhase("phase1", 100, "2026-05-18", "2026-05-30", [
				true,
				true,
				true,
				true
			]),
			createPhase("phase2", 25, "2026-06-02", "", [true, false, false, false]),
			createPhase("phase3", 0, "", "", [false, false]),
			createPhase("phase4", 0, "", "", [false, false, false])
		]
	},
	{
		id: "acct_003",
		accountName: "Harborview Surgical Center",
		surgeonName: "Dr. Olivia Martinez",
		region: "East",
		owner: "Simes",
		nextAction: "Support next activation case",
		createdDate: "2026-05-05",
		lastUpdatedDate: "2026-06-20",
		phases: [
			createPhase("phase1", 100, "2026-05-05", "2026-05-18", [
				true,
				true,
				true,
				true
			]),
			createPhase("phase2", 100, "2026-05-20", "2026-06-08", [
				true,
				true,
				true,
				true
			]),
			createPhase("phase3", 60, "2026-06-09", "", [true, false]),
			createPhase("phase4", 0, "", "", [false, false, false])
		]
	},
	{
		id: "acct_004",
		accountName: "Summit Regional Hospital",
		surgeonName: "Dr. Hannah Lee",
		region: "West",
		owner: "Cirano",
		nextAction: "Identify surgeon champion",
		createdDate: "2026-06-12",
		lastUpdatedDate: "2026-06-12",
		phases: [
			createPhase("phase1", 0, "", "", [false, false, false, false]),
			createPhase("phase2", 0, "", "", [false, false, false, false]),
			createPhase("phase3", 0, "", "", [false, false]),
			createPhase("phase4", 0, "", "", [false, false, false])
		]
	},
	{
		id: "acct_005",
		accountName: "Lakeside Cancer Institute",
		surgeonName: "Dr. Alan Brooks",
		region: "West",
		owner: "Simes",
		nextAction: "Monitor program growth",
		createdDate: "2026-03-10",
		lastUpdatedDate: "2026-06-18",
		phases: [
			createPhase("phase1", 100, "2026-03-10", "2026-03-22", [
				true,
				true,
				true,
				true
			]),
			createPhase("phase2", 100, "2026-03-25", "2026-04-13", [
				true,
				true,
				true,
				true
			]),
			createPhase("phase3", 100, "2026-04-14", "2026-05-10", [true, true]),
			createPhase("phase4", 100, "2026-05-11", "2026-06-18", [true, true, true])
		]
	},
	{
		id: "acct_006",
		accountName: "Oak Ridge Medical Group",
		surgeonName: "Dr. Priya Patel",
		region: "West",
		owner: "Cirano",
		nextAction: "Complete vendor workflow review",
		createdDate: "2026-04-28",
		lastUpdatedDate: "2026-06-21",
		phases: [
			createPhase("phase1", 100, "2026-04-28", "2026-05-10", [
				true,
				true,
				true,
				true
			]),
			createPhase("phase2", 75, "2026-05-11", "", [true, true, true, false]),
			createPhase("phase3", 0, "", "", [false, false]),
			createPhase("phase4", 0, "", "", [false, false, false])
		]
	}
];

let accounts = loadAccounts();

function createPhase(
	templateId,
	progress,
	startDate,
	completeDate,
	completedTasks = []
) {
	const template = PHASE_TEMPLATES.find((phase) => phase.id === templateId);

	return {
		id: template.id,
		shortName: template.shortName,
		label: template.label,
		progress,
		startDate,
		completeDate,
		tasks: template.tasks.map((taskLabel, index) => {
			return {
				id: `${template.id}_task_${index + 1}`,
				label: taskLabel,
				completed: Boolean(completedTasks[index])
			};
		})
	};
}

function createBlankPhase(template) {
	return createPhase(
		template.id,
		0,
		"",
		"",
		template.tasks.map(() => false)
	);
}

function createBlankAccount(region = "") {
	const today = getTodayDateString();

	return {
		id: "new",
		accountName: "",
		surgeonName: "",
		region: REGIONS.includes(region) ? region : REGIONS[0],
		owner: OWNERS[0],
		nextAction: "",
		createdDate: today,
		lastUpdatedDate: today,
		phases: PHASE_TEMPLATES.map(createBlankPhase)
	};
}

function normalizeAccount(account) {
	const today = getTodayDateString();
	const savedPhases = Array.isArray(account.phases) ? account.phases : [];

	return {
		id: cleanText(account.id) || `acct_${Date.now()}`,
		accountName: cleanText(account.accountName),
		surgeonName: cleanText(account.surgeonName),
		region: REGIONS.includes(account.region) ? account.region : REGIONS[0],
		owner: OWNERS.includes(account.owner) ? account.owner : OWNERS[0],
		nextAction: cleanText(account.nextAction),
		createdDate: cleanText(account.createdDate) || today,
		lastUpdatedDate: cleanText(account.lastUpdatedDate) || today,
		phases: PHASE_TEMPLATES.map((template) => {
			const savedPhase =
				savedPhases.find((phase) => phase.id === template.id) || {};
			const savedTasks = Array.isArray(savedPhase.tasks)
				? savedPhase.tasks
				: [];

			return {
				id: template.id,
				shortName: template.shortName,
				label: template.label,
				progress: clampNumber(savedPhase.progress, 0, 100),
				startDate: cleanText(savedPhase.startDate),
				completeDate: cleanText(savedPhase.completeDate),
				tasks: template.tasks.map((taskLabel, index) => {
					const savedTask = savedTasks[index] || {};

					return {
						id: `${template.id}_task_${index + 1}`,
						label: taskLabel,
						completed: Boolean(savedTask.completed)
					};
				})
			};
		})
	};
}

function loadAccounts() {
	const savedAccounts = localStorage.getItem(STORAGE_KEY);

	if (!savedAccounts) {
		return demoAccounts.map(normalizeAccount);
	}

	try {
		const parsedAccounts = JSON.parse(savedAccounts);

		if (!Array.isArray(parsedAccounts)) {
			return demoAccounts.map(normalizeAccount);
		}

		return parsedAccounts
			.map(normalizeAccount)
			.filter((account) => account.accountName !== "");
	} catch (error) {
		console.error("Could not load saved accounts.", error);
		return demoAccounts.map(normalizeAccount);
	}
}

function saveAccounts() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function escapeHtml(value) {
	const stringValue = String(value ?? "");

	return stringValue
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function cleanText(value) {
	return String(value ?? "")
		.trim()
		.replace(/\s+/g, " ");
}

function clampNumber(value, min, max) {
	const numberValue = Number(value);

	if (Number.isNaN(numberValue)) {
		return min;
	}

	return Math.min(Math.max(numberValue, min), max);
}

function getTodayDateString() {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
	if (!dateString) {
		return "";
	}

	const date = new Date(`${dateString}T00:00:00`);

	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric"
	});
}

function addDaysToDate(dateString, days) {
	if (!dateString) {
		return "";
	}

	const date = new Date(`${dateString}T00:00:00`);
	date.setDate(date.getDate() + Number(days));

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function isPastTargetDate(dateString) {
	if (!dateString) {
		return false;
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const targetDate = new Date(`${dateString}T00:00:00`);

	return targetDate < today;
}

function getPhaseTemplate(phaseId) {
	return PHASE_TEMPLATES.find((template) => template.id === phaseId);
}

function getCalculatedTargetDate(phase) {
	const template = getPhaseTemplate(phase.id);

	if (!phase.startDate || !template) {
		return "";
	}

	return addDaysToDate(phase.startDate, template.targetDays);
}

function getEffectivePhaseStatus(phase) {
	if (phase.completeDate) {
		return "Completed";
	}

	if (!phase.startDate) {
		return "Not Started";
	}

	const targetDate = getCalculatedTargetDate(phase);

	if (targetDate && isPastTargetDate(targetDate)) {
		return "At-Risk";
	}

	return "In Progress";
}

function getCurrentPhase(account) {
	const firstIncompletePhase = account.phases.find(
		(phase) => getEffectivePhaseStatus(phase) !== "Completed"
	);
	return firstIncompletePhase || account.phases[account.phases.length - 1];
}

function getAccountStatus(account) {
	const phaseStatuses = account.phases.map(getEffectivePhaseStatus);

	if (phaseStatuses.every((status) => status === "Completed")) {
		return "Completed";
	}

	if (phaseStatuses.includes("At-Risk")) {
		return "At-Risk";
	}

	if (phaseStatuses.includes("In Progress")) {
		return "In Progress";
	}

	return "Not Started";
}

function getStatusClass(status) {
	const normalizedStatus = status
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z-]/g, "");
	return `status-${normalizedStatus}`;
}

function getPhaseCardClass(phase) {
	const effectiveStatus = getEffectivePhaseStatus(phase);

	if (effectiveStatus === "Completed") {
		return "phase-card-completed";
	}

	if (effectiveStatus === "At-Risk") {
		return "phase-card-at-risk";
	}

	if (effectiveStatus === "In Progress") {
		return "phase-card-in-progress";
	}

	return "phase-card-not-started";
}

function getAccountTargetDate(account) {
	const currentPhase = getCurrentPhase(account);
	return getCalculatedTargetDate(currentPhase);
}

function getDashboardMetrics(accountList) {
	return {
		totalActive: accountList.filter(
			(account) => getAccountStatus(account) !== "Completed"
		).length,
		inProgress: accountList.filter(
			(account) => getAccountStatus(account) === "In Progress"
		).length,
		atRisk: accountList.filter(
			(account) => getAccountStatus(account) === "At-Risk"
		).length,
		completed: accountList.filter(
			(account) => getAccountStatus(account) === "Completed"
		).length
	};
}

function getPhaseMetrics(accountList) {
	return PHASE_TEMPLATES.map((template) => {
		const accountsInPhase = accountList.filter(
			(account) => getCurrentPhase(account).id === template.id
		);
		const atRiskAccounts = accountsInPhase.filter(
			(account) => getAccountStatus(account) === "At-Risk"
		);

		return {
			...template,
			accountCount: accountsInPhase.length,
			atRiskCount: atRiskAccounts.length
		};
	});
}

function getAccountOptions() {
	return accounts
		.map((account) => account.accountName)
		.sort((a, b) => a.localeCompare(b));
}

function getFilteredAccounts(accountList) {
	return accountList.filter((account) => {
		const currentPhase = getCurrentPhase(account);
		const accountStatus = getAccountStatus(account);

		const matchesPhase =
			accountFilters.phase === "" || currentPhase.id === accountFilters.phase;
		const matchesStatus =
			accountFilters.status === "" || accountStatus === accountFilters.status;
		const matchesAccount =
			accountFilters.account === "" ||
			account.accountName === accountFilters.account;
		const matchesOwner =
			accountFilters.owner === "" || account.owner === accountFilters.owner;

		return matchesPhase && matchesStatus && matchesAccount && matchesOwner;
	});
}

function getVisibleAccountsForCurrentRoute() {
	const routeParts = getRouteParts();

	if (routeParts[0] === "region" && routeParts[1]) {
		return getFilteredAccounts(
			accounts.filter((account) => account.region === routeParts[1])
		);
	}

	return getFilteredAccounts(accounts);
}

function renderSummaryTiles(accountList) {
	const metrics = getDashboardMetrics(accountList);

	const cards = [
		{
			label: "Total Active Accounts",
			value: metrics.totalActive
		},
		{
			label: "Total In-Progress Accounts",
			value: metrics.inProgress
		},
		{
			label: "Total At-Risk Accounts",
			value: metrics.atRisk
		},
		{
			label: "Completed Accounts",
			value: metrics.completed
		}
	];

	return `
    <section class="summary-grid" aria-label="Account summary tiles">
      ${cards
				.map((card) => {
					return `
          <article class="summary-tile">
            <p>${escapeHtml(card.label)}</p>
            <strong>${escapeHtml(card.value)}</strong>
          </article>
        `;
				})
				.join("")}
    </section>
  `;
}

function renderPhaseProgressLine(accountList) {
	const phaseMetrics = getPhaseMetrics(accountList);
	const completedAccountCount = accountList.filter(
		(account) => getAccountStatus(account) === "Completed"
	).length;

	return `
    <section class="phase-line-card" aria-label="Pathway phase progress line">
      <div class="phase-line">
        ${phaseMetrics
					.map((phase, index) => {
						return `
            <div class="phase-node-wrapper">
              <div class="phase-counts">
                <span>${phase.accountCount} Account${phase.accountCount === 1 ? "" : "s"}</span>
                <span>${phase.atRiskCount} At-Risk</span>
              </div>
              <div class="phase-node">${escapeHtml(phase.shortName)}</div>
              ${index < phaseMetrics.length - 1 ? `<div class="phase-connector"></div>` : ""}
            </div>
          `;
					})
					.join("")}
        <span class="phase-line-total">${completedAccountCount} Completed Account${completedAccountCount === 1 ? "" : "s"}</span>
      </div>
    </section>
  `;
}

function renderToolbar(options = {}) {
	const showDashboardButton = options.showDashboardButton || false;
	const showAccountListButton = options.showAccountListButton || false;
	const showViewToggle = options.showViewToggle || false;
	const region = options.region || "";

	return `
    <section class="toolbar" aria-label="Page tools">
      <div class="toolbar-left">
        ${
					showDashboardButton
						? `
          <a class="icon-button" href="#/region/${encodeURIComponent(region)}/dashboard" aria-label="View region dashboard">👁</a>
        `
						: ""
				}

        ${
					showAccountListButton
						? `
          <a class="secondary-button" href="#/region/${encodeURIComponent(region)}/accounts">Account List</a>
        `
						: ""
				}

        ${
					showViewToggle
						? `
          <button class="secondary-button ${regionListViewMode === "tiles" ? "active" : ""}" type="button" data-action="set-view-mode" data-view-mode="tiles">Tiles</button>
          <button class="secondary-button ${regionListViewMode === "table" ? "active" : ""}" type="button" data-action="set-view-mode" data-view-mode="table">Table</button>
        `
						: ""
				}

        <button class="filter-icon-button" type="button" data-action="open-filters" aria-label="Open filters">⏷</button>
        <button class="gear-icon-button" type="button" data-action="open-data-tools" aria-label="Open data tools">⚙</button>
      </div>

      <div class="toolbar-right">
        ${
					region
						? `
          <a class="primary-button" href="#/account/new/${encodeURIComponent(region)}">+ New Account</a>
        `
						: ""
				}
      </div>
    </section>
  `;
}

function renderAccountTable(accountList) {
	if (accountList.length === 0) {
		return `
      <section class="table-card empty-card">
        No accounts match the current filters.
      </section>
    `;
	}

	return `
    <section class="table-card">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Surgeon</th>
              <th>Region</th>
              <th>Owner</th>
              <th>Phase</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Next Action</th>
              <th>Next Target Date</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${accountList.map(renderAccountTableRow).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAccountTableRow(account) {
	const currentPhase = getCurrentPhase(account);
	const status = getAccountStatus(account);

	return `
    <tr>
      <td><strong>${escapeHtml(account.accountName)}</strong></td>
      <td>${escapeHtml(account.surgeonName)}</td>
      <td>${escapeHtml(account.region)}</td>
      <td>${escapeHtml(account.owner)}</td>
      <td>${escapeHtml(currentPhase.shortName)}</td>
      <td><span class="status-pill ${getStatusClass(status)}">${escapeHtml(status)}</span></td>
      <td>
        <div class="mini-progress">
          <div style="width: ${currentPhase.progress}%"></div>
        </div>
        <span class="progress-text">${currentPhase.progress}%</span>
      </td>
      <td>${escapeHtml(account.nextAction || "—")}</td>
      <td>${escapeHtml(formatDate(getAccountTargetDate(account)))}</td>
      <td>${escapeHtml(formatDate(account.lastUpdatedDate))}</td>
      <td>
        <a class="table-action-link" href="#/account/${encodeURIComponent(account.id)}">✎</a>
      </td>
    </tr>
  `;
}

function renderAccountTiles(accountList) {
	if (accountList.length === 0) {
		return `<section class="empty-card">No accounts match the current filters.</section>`;
	}

	return `
    <section class="account-tile-grid">
      ${accountList
				.map((account) => {
					const currentPhase = getCurrentPhase(account);
					const status = getAccountStatus(account);

					return `
          <article class="account-tile ${getStatusClass(status)}-border">
            <a class="tile-edit-link" href="#/account/${encodeURIComponent(account.id)}" aria-label="Edit account">✎</a>
            <h3>${escapeHtml(account.accountName)}</h3>
            <p class="tile-surgeon">${escapeHtml(account.surgeonName)}</p>
            <p class="tile-phase">${escapeHtml(currentPhase.shortName)}</p>
            <p class="tile-status ${getStatusClass(status)}-text">${escapeHtml(status)}</p>
            <p class="tile-next-action"><strong>Next:</strong> ${escapeHtml(account.nextAction || "No next action set")}</p>
            <div class="mini-progress">
              <div style="width: ${currentPhase.progress}%"></div>
            </div>
            <p class="tile-target">${escapeHtml(formatDate(getAccountTargetDate(account)) || "No target date")}</p>
          </article>
        `;
				})
				.join("")}
    </section>
  `;
}

function renderMapCards() {
	return `
    <section class="map-grid" aria-label="Region map navigation">
      ${REGIONS.map((region) => {
				return `
          <a class="map-card" href="#/region/${encodeURIComponent(region)}/accounts">
            <div class="map-visual map-${region.toLowerCase()}">
              <span>${escapeHtml(region)}</span>
            </div>
            <strong>${escapeHtml(region)} Account List</strong>
            <p>Open accounts assigned to the ${escapeHtml(region)} region.</p>
          </a>
        `;
			}).join("")}
    </section>
  `;
}

function renderLandingPage() {
	const visibleAccounts = getFilteredAccounts(accounts);

	appRoot.innerHTML = `
    <section class="page-heading">
      <div>
        <p class="eyebrow-dark">Global View</p>
        <h2>Landing Dashboard</h2>
        <p>Summary of all accounts and pathway progress.</p>
      </div>
    </section>

    ${renderMapCards()}
    ${renderSummaryTiles(visibleAccounts)}
    ${renderPhaseProgressLine(visibleAccounts)}
    ${renderToolbar()}
    ${renderAccountTable(visibleAccounts)}
  `;
}

function renderRegionAccountList(region) {
	const regionAccounts = accounts.filter(
		(account) => account.region === region
	);
	const visibleAccounts = getFilteredAccounts(regionAccounts);

	appRoot.innerHTML = `
    <section class="page-heading page-heading-with-actions">
      <div>
        <p class="eyebrow-dark">Region View</p>
        <h2>${escapeHtml(region)} Account List</h2>
        <p>Accounts belonging to the ${escapeHtml(region)} region.</p>
      </div>
      <a class="secondary-button" href="#/">Back to Landing</a>
    </section>

    ${renderToolbar({ region, showDashboardButton: true, showViewToggle: true })}
    ${regionListViewMode === "tiles" ? renderAccountTiles(visibleAccounts) : renderAccountTable(visibleAccounts)}
  `;
}

function renderRegionDashboard(region) {
	const regionAccounts = accounts.filter(
		(account) => account.region === region
	);
	const visibleAccounts = getFilteredAccounts(regionAccounts);

	appRoot.innerHTML = `
    <section class="page-heading page-heading-with-actions">
      <div>
        <p class="eyebrow-dark">Region Dashboard</p>
        <h2>${escapeHtml(region)} Dashboard</h2>
        <p>Summary of accounts and pathway progress in the ${escapeHtml(region)} region.</p>
      </div>
      <a class="secondary-button" href="#/">Back to Landing</a>
    </section>

    ${renderToolbar({ region, showAccountListButton: true })}
    ${renderSummaryTiles(visibleAccounts)}
    ${renderPhaseProgressLine(visibleAccounts)}
    ${renderAccountTable(visibleAccounts)}
  `;
}

function renderRegionOptions(selectedRegion) {
	return REGIONS.map((region) => {
		const selected = region === selectedRegion ? "selected" : "";
		return `<option value="${escapeHtml(region)}" ${selected}>${escapeHtml(region)}</option>`;
	}).join("");
}

function renderOwnerOptions(selectedOwner) {
	return OWNERS.map((owner) => {
		const selected = owner === selectedOwner ? "selected" : "";
		return `<option value="${escapeHtml(owner)}" ${selected}>${escapeHtml(owner)}</option>`;
	}).join("");
}

function renderAccountPage(accountId, preselectedRegion = "") {
	const isNewAccount = accountId === "new";
	const existingAccount = accounts.find((account) => account.id === accountId);
	const account = isNewAccount
		? createBlankAccount(preselectedRegion)
		: existingAccount;

	if (!account) {
		appRoot.innerHTML = `
      <section class="page-heading page-heading-with-actions">
        <div>
          <p class="eyebrow-dark">Account Page</p>
          <h2>Account Not Found</h2>
          <p>The selected account could not be found.</p>
        </div>
        <a class="secondary-button" href="#/">Back to Landing</a>
      </section>
    `;
		return;
	}

	renderAccountPageLayout(account, isNewAccount);
}

function renderAccountPageLayout(account, isNewAccount) {
	const accountStatus = getAccountStatus(account);
	const backRegion = account.region;
	const backLink = backRegion
		? `#/region/${encodeURIComponent(backRegion)}/accounts`
		: "#/";
	const pageAccountId = isNewAccount ? "new" : account.id;

	appRoot.innerHTML = `
    <section class="account-page-shell" data-account-id="${escapeHtml(pageAccountId)}" data-is-new-account="${isNewAccount}">
      <section class="account-page-title-bar">
        <div>
          <p class="eyebrow-dark">Account Page</p>
          <h2>${isNewAccount ? "New Account" : `${escapeHtml(account.accountName)} | ${escapeHtml(account.surgeonName)}`}</h2>
        </div>
        <div class="account-title-actions">
          <button class="gear-icon-button" type="button" data-action="open-data-tools" aria-label="Open data tools">⚙</button>
          <button class="primary-button" type="button" data-action="save-account-page">Save Account</button>
          ${!isNewAccount ? `<button class="danger-button" type="button" data-action="delete-account-page">Delete Account</button>` : ""}
          <a class="secondary-button" href="${backLink}">Back</a>
        </div>
      </section>

      <section class="account-overview-card">
        <div class="account-status-summary">
          <div class="account-status-circle ${getStatusClass(accountStatus)}"></div>
          <strong class="${getStatusClass(accountStatus)}-text">${escapeHtml(accountStatus)}</strong>
          <span>Current pathway status</span>
        </div>

        <div class="account-core-fields">
          <label>
            Account Name
            <input id="accountNameDetailInput" class="account-detail-input" type="text" value="${escapeHtml(account.accountName)}" placeholder="Account Name" />
          </label>

          <label>
            Surgeon
            <input id="surgeonNameDetailInput" class="account-detail-input" type="text" value="${escapeHtml(account.surgeonName)}" placeholder="Surgeon" />
          </label>

          <label>
            Region
            <select id="regionDetailInput" class="account-detail-input">
              ${renderRegionOptions(account.region)}
            </select>
          </label>

          <label>
            Owner
            <select id="ownerDetailInput" class="account-detail-input">
              ${renderOwnerOptions(account.owner)}
            </select>
          </label>

          <label class="account-core-field-wide">
            Next Action
            <input
              id="nextActionDetailInput"
              class="account-detail-input"
              type="text"
              value="${escapeHtml(account.nextAction)}"
              placeholder="Example: Schedule Phase II workflow planning session"
            />
          </label>
        </div>
      </section>

      <p id="accountPageMessage" class="account-page-message"></p>

      <section class="account-phase-list">
        ${account.phases.map(renderAccountPhaseCard).join("")}
      </section>
    </section>
  `;
}

function renderAccountPhaseCard(phase) {
	const effectiveStatus = getEffectivePhaseStatus(phase);
	const calculatedTargetDate = getCalculatedTargetDate(phase);

	return `
    <article class="phase-card-row" data-phase-id="${escapeHtml(phase.id)}">
      <aside class="phase-status-side">
        <span>Auto Status</span>
        <strong class="${getStatusClass(effectiveStatus)}-text">${escapeHtml(effectiveStatus)}</strong>
      </aside>

      <section class="account-phase-card ${getPhaseCardClass(phase)}">
        <div class="phase-card-main">
          <div class="phase-card-header">
            <div>
              <h3>${escapeHtml(phase.shortName)}</h3>
              <p>${escapeHtml(phase.label)}</p>
            </div>
          </div>

          <div class="phase-progress-row">
            <label for="progress_${escapeHtml(phase.id)}">[Progress]</label>
            <input
              id="progress_${escapeHtml(phase.id)}"
              type="range"
              min="0"
              max="100"
              value="${escapeHtml(phase.progress)}"
              data-action="phase-progress-input"
              data-phase-id="${escapeHtml(phase.id)}"
              data-phase-field="progress"
            />
            <strong id="progressText_${escapeHtml(phase.id)}">${escapeHtml(phase.progress)}%</strong>
          </div>

          <div class="phase-task-list">
            ${phase.tasks
							.map((task, taskIndex) => {
								return `
                <label class="phase-task-item">
                  <input
                    type="checkbox"
                    ${task.completed ? "checked" : ""}
                    data-phase-field="task"
                    data-task-index="${taskIndex}"
                  />
                  <span>${escapeHtml(task.label)}</span>
                </label>
              `;
							})
							.join("")}
          </div>
        </div>

        <div class="phase-date-fields">
          <label>
            [start date]
            <input
              type="date"
              value="${escapeHtml(phase.startDate)}"
              data-action="phase-date-change"
              data-phase-id="${escapeHtml(phase.id)}"
              data-phase-field="startDate"
            />
          </label>

          <label>
            [target date]
            <span
              id="targetDate_${escapeHtml(phase.id)}"
              class="target-date-display"
              data-calculated-target-date="${escapeHtml(calculatedTargetDate)}"
            >${escapeHtml(formatDate(calculatedTargetDate) || "Set start date")}</span>
          </label>

          <label>
            [complete date]
            <input
              type="date"
              value="${escapeHtml(phase.completeDate)}"
              data-action="phase-date-change"
              data-phase-id="${escapeHtml(phase.id)}"
              data-phase-field="completeDate"
            />
          </label>
        </div>
      </section>
    </article>
  `;
}

function collectAccountFromPage() {
	const pageShell = document.querySelector(".account-page-shell");
	const isNewAccount = pageShell.dataset.isNewAccount === "true";
	const existingId = pageShell.dataset.accountId;
	const existingAccount = accounts.find((account) => account.id === existingId);
	const today = getTodayDateString();

	return {
		id: isNewAccount ? `acct_${Date.now()}` : existingId,
		accountName: cleanText(
			document.getElementById("accountNameDetailInput").value
		),
		surgeonName: cleanText(
			document.getElementById("surgeonNameDetailInput").value
		),
		region: document.getElementById("regionDetailInput").value,
		owner: document.getElementById("ownerDetailInput").value,
		nextAction: cleanText(
			document.getElementById("nextActionDetailInput").value
		),
		createdDate: existingAccount?.createdDate || today,
		lastUpdatedDate: today,
		phases: PHASE_TEMPLATES.map((template) => {
			const phaseRow = document.querySelector(
				`[data-phase-id="${template.id}"]`
			);

			return {
				id: template.id,
				shortName: template.shortName,
				label: template.label,
				progress: clampNumber(
					phaseRow.querySelector("[data-phase-field='progress']").value,
					0,
					100
				),
				startDate: phaseRow.querySelector("[data-phase-field='startDate']")
					.value,
				completeDate: phaseRow.querySelector(
					"[data-phase-field='completeDate']"
				).value,
				tasks: template.tasks.map((taskLabel, taskIndex) => {
					const checkbox = phaseRow.querySelector(
						`[data-phase-field='task'][data-task-index='${taskIndex}']`
					);

					return {
						id: `${template.id}_task_${taskIndex + 1}`,
						label: taskLabel,
						completed: checkbox.checked
					};
				})
			};
		})
	};
}

function validateAccountPage(account) {
	const missingFields = [];

	if (!account.accountName) {
		missingFields.push("Account Name");
	}

	if (!account.surgeonName) {
		missingFields.push("Surgeon");
	}

	if (!account.region) {
		missingFields.push("Region");
	}

	if (!account.owner) {
		missingFields.push("Owner");
	}

	return missingFields;
}

function setAccountPageMessage(message, type) {
	const messageElement = document.getElementById("accountPageMessage");

	if (!messageElement) {
		return;
	}

	messageElement.textContent = message;
	messageElement.className = `account-page-message ${type || ""}`;
}

function handleSaveAccountPage() {
	const account = collectAccountFromPage();
	const missingFields = validateAccountPage(account);

	if (missingFields.length > 0) {
		setAccountPageMessage(
			`Please complete: ${missingFields.join(", ")}.`,
			"error"
		);
		return;
	}

	const pageShell = document.querySelector(".account-page-shell");
	const isNewAccount = pageShell.dataset.isNewAccount === "true";

	if (isNewAccount) {
		accounts.push(account);
		saveAccounts();
		window.location.hash = `#/account/${encodeURIComponent(account.id)}`;
		return;
	}

	accounts = accounts.map((existingAccount) => {
		if (existingAccount.id === account.id) {
			return account;
		}

		return existingAccount;
	});

	saveAccounts();
	renderRoute();
	setAccountPageMessage("Account pathway saved.", "success");
}

function handleDeleteAccountPage() {
	const pageShell = document.querySelector(".account-page-shell");

	if (!pageShell) {
		return;
	}

	const accountId = pageShell.dataset.accountId;
	const isNewAccount = pageShell.dataset.isNewAccount === "true";

	if (isNewAccount || accountId === "new") {
		setAccountPageMessage(
			"This account has not been saved yet, so there is nothing to delete.",
			"error"
		);
		return;
	}

	const accountToDelete = accounts.find((account) => account.id === accountId);

	if (!accountToDelete) {
		setAccountPageMessage("The selected account could not be found.", "error");
		return;
	}

	const confirmed = window.confirm(
		`Delete this account?\n\n` +
			`Account: ${accountToDelete.accountName}\n` +
			`Surgeon: ${accountToDelete.surgeonName}\n\n` +
			`This will permanently remove the account from this browser's saved tracker data.`
	);

	if (!confirmed) {
		return;
	}

	const returnRegion = accountToDelete.region;

	accounts = accounts.filter((account) => account.id !== accountId);
	saveAccounts();

	window.location.hash = `#/region/${encodeURIComponent(returnRegion)}/accounts`;
}

function getRouteParts() {
	const hash = window.location.hash || "#/";
	return hash
		.replace(/^#\/?/, "")
		.split("/")
		.filter(Boolean)
		.map(decodeURIComponent);
}

function renderRoute() {
	const routeParts = getRouteParts();

	if (routeParts.length === 0) {
		renderLandingPage();
		return;
	}

	if (routeParts[0] === "region" && routeParts[2] === "accounts") {
		renderRegionAccountList(routeParts[1]);
		return;
	}

	if (routeParts[0] === "region" && routeParts[2] === "dashboard") {
		renderRegionDashboard(routeParts[1]);
		return;
	}

	if (routeParts[0] === "account") {
		renderAccountPage(routeParts[1], routeParts[2]);
		return;
	}

	renderLandingPage();
}

function openFilterModal() {
	populateFilterModal();
	document.getElementById("filterModal").classList.remove("hidden");
}

function closeFilterModal() {
	document.getElementById("filterModal").classList.add("hidden");
}

function openDataToolsModal() {
	setDataToolsMessage("", "");
	document.getElementById("dataToolsModal").classList.remove("hidden");
}

function closeDataToolsModal() {
	document.getElementById("dataToolsModal").classList.add("hidden");
}

function setDataToolsMessage(message, type) {
	const messageElement = document.getElementById("dataToolsMessage");

	if (!messageElement) {
		return;
	}

	messageElement.textContent = message;
	messageElement.className = type ? `form-message ${type}` : "form-message";
}

function populateSelect(selectId, options, defaultLabel, selectedValue) {
	const selectElement = document.getElementById(selectId);

	selectElement.innerHTML = `
    <option value="">${escapeHtml(defaultLabel)}</option>
    ${options
			.map((option) => {
				const value = typeof option === "string" ? option : option.value;
				const label = typeof option === "string" ? option : option.label;
				const selected = value === selectedValue ? "selected" : "";
				return `<option value="${escapeHtml(value)}" ${selected}>${escapeHtml(label)}</option>`;
			})
			.join("")}
  `;
}

function populateFilterModal() {
	populateSelect(
		"filterPhaseInput",
		PHASE_TEMPLATES.map((phase) => ({
			value: phase.id,
			label: phase.shortName
		})),
		"All phases",
		accountFilters.phase
	);

	populateSelect(
		"filterStatusInput",
		STATUS_OPTIONS,
		"All statuses",
		accountFilters.status
	);
	populateSelect(
		"filterAccountInput",
		getAccountOptions(),
		"All accounts",
		accountFilters.account
	);
	populateSelect(
		"filterOwnerInput",
		OWNERS,
		"All owners",
		accountFilters.owner
	);
}

function applyFiltersFromModal() {
	accountFilters = {
		phase: document.getElementById("filterPhaseInput").value,
		status: document.getElementById("filterStatusInput").value,
		account: document.getElementById("filterAccountInput").value,
		owner: document.getElementById("filterOwnerInput").value
	};

	closeFilterModal();
	renderRoute();
}

function clearFilters() {
	accountFilters = {
		phase: "",
		status: "",
		account: "",
		owner: ""
	};

	populateFilterModal();
	closeFilterModal();
	renderRoute();
}

function getCsvSafeValue(value) {
	const stringValue = String(value ?? "");
	return `"${stringValue.replaceAll('"', '""')}"`;
}

function convertAccountsToCsv(accountList) {
	const headers = [
		"Account",
		"Surgeon",
		"Region",
		"Owner",
		"Current Phase",
		"Status",
		"Progress",
		"Next Action",
		"Next Target Date",
		"Last Updated"
	];

	const rows = accountList.map((account) => {
		const currentPhase = getCurrentPhase(account);

		return [
			account.accountName,
			account.surgeonName,
			account.region,
			account.owner,
			currentPhase.shortName,
			getAccountStatus(account),
			`${currentPhase.progress}%`,
			account.nextAction,
			getAccountTargetDate(account),
			account.lastUpdatedDate
		];
	});

	return [
		headers.map(getCsvSafeValue).join(","),
		...rows.map((row) => row.map(getCsvSafeValue).join(","))
	].join("\n");
}

function downloadTextFile(filename, content, mimeType) {
	const shouldAddBom = mimeType.toLowerCase().includes("csv");
	const fileContent = shouldAddBom ? "\uFEFF" + content : content;

	const blob = new Blob([fileContent], { type: mimeType });
	const downloadUrl = URL.createObjectURL(blob);
	const temporaryLink = document.createElement("a");

	temporaryLink.href = downloadUrl;
	temporaryLink.download = filename;

	document.body.appendChild(temporaryLink);
	temporaryLink.click();
	document.body.removeChild(temporaryLink);

	URL.revokeObjectURL(downloadUrl);
}

function handleExportAllCsv() {
	if (accounts.length === 0) {
		setDataToolsMessage("No accounts are available to export.", "error");
		return;
	}

	downloadTextFile(
		`surgeon-pathway-all-accounts-${getTodayDateString()}.csv`,
		convertAccountsToCsv(accounts),
		"text/csv;charset=utf-8;"
	);

	setDataToolsMessage(
		`Exported ${accounts.length} account(s) to CSV.`,
		"success"
	);
}

function handleExportCurrentCsv() {
	const visibleAccounts = getVisibleAccountsForCurrentRoute();

	if (visibleAccounts.length === 0) {
		setDataToolsMessage(
			"No accounts in the current view are available to export.",
			"error"
		);
		return;
	}

	downloadTextFile(
		`surgeon-pathway-current-view-${getTodayDateString()}.csv`,
		convertAccountsToCsv(visibleAccounts),
		"text/csv;charset=utf-8;"
	);

	setDataToolsMessage(
		`Exported ${visibleAccounts.length} current-view account(s) to CSV.`,
		"success"
	);
}

function handleExportJsonBackup() {
	const backup = {
		appName: "Surgeon Pathway Tracker",
		backupVersion: 1,
		exportedAt: new Date().toISOString(),
		accounts
	};

	downloadTextFile(
		`surgeon-pathway-backup-${getTodayDateString()}.json`,
		JSON.stringify(backup, null, 2),
		"application/json;charset=utf-8;"
	);

	setDataToolsMessage(
		`Exported JSON backup with ${accounts.length} account(s).`,
		"success"
	);
}

function handleImportJsonBackupClick() {
	document.getElementById("importJsonBackupInput").click();
}

function handleImportJsonBackupFileSelected(event) {
	const selectedFile = event.target.files[0];

	if (!selectedFile) {
		return;
	}

	const reader = new FileReader();

	reader.onload = function (loadEvent) {
		let parsedBackup;

		try {
			parsedBackup = JSON.parse(
				String(loadEvent.target.result || "").replace(/^\uFEFF/, "")
			);
		} catch (error) {
			console.error("Could not parse JSON backup.", error);
			setDataToolsMessage("The selected file is not valid JSON.", "error");
			event.target.value = "";
			return;
		}

		const importedAccounts = Array.isArray(parsedBackup)
			? parsedBackup
			: parsedBackup.accounts;

		if (!Array.isArray(importedAccounts)) {
			setDataToolsMessage(
				"The selected JSON file does not contain an accounts array.",
				"error"
			);
			event.target.value = "";
			return;
		}

		const normalizedAccounts = importedAccounts
			.map(normalizeAccount)
			.filter((account) => account.accountName !== "");

		const confirmed = window.confirm(
			`Import this JSON backup?\n\n` +
				`This will replace the current browser-saved tracker data.\n\n` +
				`Backup contains ${normalizedAccounts.length} account(s).`
		);

		if (!confirmed) {
			event.target.value = "";
			return;
		}

		accounts = normalizedAccounts;
		saveAccounts();
		event.target.value = "";
		setDataToolsMessage(`Imported ${accounts.length} account(s).`, "success");
		renderRoute();
	};

	reader.onerror = function () {
		setDataToolsMessage("The selected file could not be read.", "error");
		event.target.value = "";
	};

	reader.readAsText(selectedFile);
}

function handleResetDemoData() {
	const confirmed = window.confirm(
		"Reset demo data?\n\nThis will remove browser-saved tracker data and restore the default demo accounts."
	);

	if (!confirmed) {
		return;
	}

	localStorage.removeItem(STORAGE_KEY);
	accounts = demoAccounts.map(normalizeAccount);
	setDataToolsMessage("Demo data restored.", "success");
	renderRoute();
}

function handleRootClick(event) {
	const actionElement = event.target.closest("[data-action]");

	if (!actionElement) {
		return;
	}

	const action = actionElement.dataset.action;

	if (action === "open-filters") {
		openFilterModal();
		return;
	}

	if (action === "open-data-tools") {
		openDataToolsModal();
		return;
	}

	if (action === "set-view-mode") {
		regionListViewMode = actionElement.dataset.viewMode;
		renderRoute();
		return;
	}

	if (action === "save-account-page") {
		handleSaveAccountPage();
		return;
	}

	if (action === "delete-account-page") {
		handleDeleteAccountPage();
	}
}

function handleRootInput(event) {
	const actionElement = event.target.closest("[data-action]");

	if (!actionElement) {
		return;
	}

	if (actionElement.dataset.action === "phase-progress-input") {
		const phaseId = actionElement.dataset.phaseId;
		const progressTextElement = document.getElementById(
			`progressText_${phaseId}`
		);

		if (progressTextElement) {
			progressTextElement.textContent = `${actionElement.value}%`;
		}
	}
}

function handleRootChange(event) {
	const actionElement = event.target.closest("[data-action]");

	if (!actionElement) {
		return;
	}

	if (actionElement.dataset.action === "phase-date-change") {
		const pageShell = document.querySelector(".account-page-shell");

		if (!pageShell) {
			return;
		}

		const isNewAccount = pageShell.dataset.isNewAccount === "true";
		const currentAccount = collectAccountFromPage();

		renderAccountPageLayout(currentAccount, isNewAccount);
	}
}

function attachEventListeners() {
	document.getElementById("appRoot").addEventListener("click", handleRootClick);
	document.getElementById("appRoot").addEventListener("input", handleRootInput);
	document
		.getElementById("appRoot")
		.addEventListener("change", handleRootChange);

	document
		.getElementById("applyFiltersButton")
		.addEventListener("click", applyFiltersFromModal);
	document
		.getElementById("clearFiltersButton")
		.addEventListener("click", clearFilters);
	document
		.getElementById("closeFilterModalButton")
		.addEventListener("click", closeFilterModal);
	document
		.getElementById("filterModalBackdrop")
		.addEventListener("click", closeFilterModal);

	document
		.getElementById("closeDataToolsModalButton")
		.addEventListener("click", closeDataToolsModal);
	document
		.getElementById("dataToolsModalBackdrop")
		.addEventListener("click", closeDataToolsModal);
	document
		.getElementById("exportAllCsvButton")
		.addEventListener("click", handleExportAllCsv);
	document
		.getElementById("exportCurrentCsvButton")
		.addEventListener("click", handleExportCurrentCsv);
	document
		.getElementById("exportJsonBackupButton")
		.addEventListener("click", handleExportJsonBackup);
	document
		.getElementById("importJsonBackupButton")
		.addEventListener("click", handleImportJsonBackupClick);
	document
		.getElementById("importJsonBackupInput")
		.addEventListener("change", handleImportJsonBackupFileSelected);
	document
		.getElementById("resetDemoDataButton")
		.addEventListener("click", handleResetDemoData);

	window.addEventListener("hashchange", renderRoute);
}

const appRoot = document.getElementById("appRoot");

attachEventListeners();
renderRoute();
