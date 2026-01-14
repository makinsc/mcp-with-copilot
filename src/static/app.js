document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("activity-search");
  const categoryFilter = document.getElementById("category-filter");
  const sortFilter = document.getElementById("sort-filter");
  const sortOrderFilter = document.getElementById("sort-order-filter");

  // Map activity names to categories (for demo, real data should include this)
  const activityCategories = {
    "Chess Club": "Academics",
    "Programming Class": "Academics",
    "Gym Class": "Sports",
    "Soccer Team": "Sports",
    "Basketball Team": "Sports",
    "Art Club": "Arts",
    "Drama Club": "Arts",
    "Math Club": "Academics",
    "Debate Team": "Academics"
  };

  let allActivities = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities();
      populateActivitySelect();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function renderActivities() {
    // Get filter/sort/search values
    const search = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const category = categoryFilter ? categoryFilter.value : "";
    const sortBy = sortFilter ? sortFilter.value : "name";
    const sortOrder = sortOrderFilter ? sortOrderFilter.value : "asc";

    // Convert activities to array for filtering/sorting
    let activityArr = Object.entries(allActivities);

    // Filter by category
    if (category) {
      activityArr = activityArr.filter(([name]) => {
        const activityCategory = activityCategories[name];
        // If the activity has no known category mapping, do not filter it out
        if (!activityCategory) {
          return true;
        }
        return activityCategory === category;
      });
    }

    // Filter by search
    if (search) {
      activityArr = activityArr.filter(([name, details]) => {
        const inName = name.toLowerCase().includes(search);
        const inDesc = details.description && details.description.toLowerCase().includes(search);
        const inParticipants = Array.isArray(details.participants) && details.participants.some(email => email.toLowerCase().includes(search));
        return inName || inDesc || inParticipants;
      });
    }

    // Sort
    activityArr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") {
        cmp = a[0].localeCompare(b[0]);
      } else if (sortBy === "schedule") {
        cmp = (a[1].schedule || "").localeCompare(b[1].schedule || "");
      } else if (sortBy === "availability") {
        const aSpots = a[1].max_participants - a[1].participants.length;
        const bSpots = b[1].max_participants - b[1].participants.length;
        cmp = aSpots - bSpots;
      }
      return sortOrder === "desc" ? -cmp : cmp;
    });

    // Render
    activitiesList.innerHTML = "";
    activityArr.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class=\"participants-section\">\n              <h5>Participants:</h5>\n              <ul class=\"participants-list\">\n                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class=\"participant-email\">${email}</span><button class=\"delete-btn\" data-activity=\"${name}\" data-email=\"${email}\">❌</button></li>`
                  )
                  .join("")}\n              </ul>\n            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class=\"participants-container\">\n          ${participantsHTML}\n        </div>
      `;
      activitiesList.appendChild(activityCard);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  function populateActivitySelect() {
    // Clear and repopulate the select dropdown
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    Object.keys(allActivities).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Event listeners for filters/search
  if (searchInput) searchInput.addEventListener("input", renderActivities);
  if (categoryFilter) categoryFilter.addEventListener("change", renderActivities);
  if (sortFilter) sortFilter.addEventListener("change", renderActivities);
  if (sortOrderFilter) sortOrderFilter.addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
});
