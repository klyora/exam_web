document.addEventListener("DOMContentLoaded", async () => {
  const languageLevelInput = document.querySelector("#languageLevel");
  const availableDaysInput = document.querySelector("#availableDays");
  const timeStartInput = document.querySelector("#timeStart");
  const timeEndInput = document.querySelector("#timeEnd");
  const resultsTableBody = document.querySelector("#tutorResultsTable tbody");

  const fetchTutors = async () => {
    try {
      const response = await fetch(
        `http://cat-facts-api.std-900.ist.mospolytech.ru/api/tutors?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch tutors");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching tutors:", error);
      return [];
    }
  };

  const filterTutors = (tutors) => {
    const level = languageLevelInput.value.toLowerCase();
    const day = availableDaysInput.value;
    const timeStart = timeStartInput.value;
    const timeEnd = timeEndInput.value;

    return tutors.filter((tutor) => {
      const matchesLevel =
        level === "all" || tutor.language_level.toLowerCase() === level;
      const matchesDay = day === "all" || tutor.available_days?.includes(day);
      const matchesTime =
        (!timeStart && !timeEnd) ||
        (timeStart &&
          timeEnd &&
          tutor.available_time_start <= timeStart &&
          tutor.available_time_end >= timeEnd);

      return matchesLevel && matchesDay && matchesTime;
    });
  };

  const updateResultsTable = (tutors) => {
    resultsTableBody.innerHTML = "";

    if (tutors.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.textContent = "No results found.";
      row.appendChild(cell);
      resultsTableBody.appendChild(row);
      return;
    }

    tutors.forEach((tutor) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${tutor.name}</td>
          <td>${tutor.language_level || "Not specified"}</td>
          <td>${tutor.languages_offered.join(", ")}</td>
          <td>${tutor.work_experience || "Not specified"} years</td>
          <td>${tutor.price_per_hour} RUB</td>
          <td><button class="btn btn-primary select-tutor" data-id="${
            tutor.id
          }" data-name="${tutor.name}" data-price="${
        tutor.price_per_hour
      }">Select</button></td>
        `;
      resultsTableBody.appendChild(row);
    });

    const selectButtons = resultsTableBody.querySelectorAll(".select-tutor");
    selectButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tutorName = button.getAttribute("data-name");
        const tutorPrice = button.getAttribute("data-price");
        const tutorId = button.getAttribute("data-id");

        openBookingModal(tutorName, tutorPrice, tutorId);

        const searchModal = bootstrap.Modal.getInstance(
          document.getElementById("tutorSearchModal")
        );
        searchModal.hide();
      });
    });
  };

  const openBookingModal = (tutorName, tutorPrice, tutorId) => {
    document.getElementById("selectedTutorName").value = tutorName;

    const startDateSelect = document.getElementById("startDateTutor");
    const startTimeSelect = document.getElementById("startTimeTutor");

    startDateSelect.innerHTML = "";
    startTimeSelect.innerHTML = "";

    ["2025-02-15", "2025-02-20", "2025-02-25"].forEach((date) => {
      const option = document.createElement("option");
      option.value = date;
      option.textContent = new Date(date).toLocaleDateString();
      startDateSelect.appendChild(option);
    });

    ["09:00", "10:00", "11:00"].forEach((time) => {
      const option = document.createElement("option");
      option.value = time;
      option.textContent = time;
      startTimeSelect.appendChild(option);
    });

    const updatePrice = () => {
      const options = {
        supplementary: document.getElementById("supplementaryTutor").checked,
        excursions: document.getElementById("excursionsTutor").checked,
        assessment: document.getElementById("assessmentTutor").checked,
        interactive: document.getElementById("interactiveTutor").checked,
      };

      const selectedDate = document.getElementById("startDateTutor").value;
      const basePrice = parseFloat(tutorPrice);
      const finalPrice = calculatePrice(basePrice, options, selectedDate);
      document.getElementById(
        "finalPriceDisplay"
      ).innerHTML = `Final Price: ${finalPrice.toFixed(2)} RUB`;
    };

    document
      .getElementById("supplementaryTutor")
      .addEventListener("change", updatePrice);
    document
      .getElementById("excursionsTutor")
      .addEventListener("change", updatePrice);
    document
      .getElementById("assessmentTutor")
      .addEventListener("change", updatePrice);
    document
      .getElementById("interactiveTutor")
      .addEventListener("change", updatePrice);
    startDateSelect.addEventListener("change", updatePrice);

    updatePrice();

    const bookingModal = new bootstrap.Modal(
      document.getElementById("bookTutorModal")
    );
    bookingModal.show();

    const submitButton = document.getElementById("submitOrderButton");
    submitButton.onclick = async (e) => {
      e.preventDefault();

      const orderData = {
        tutor_id: tutorId,
        date_start: startDateSelect.value,
        time_start: startTimeSelect.value,
        supplementary: document.getElementById("supplementaryTutor").checked,
        excursions: document.getElementById("excursionsTutor").checked,
        assessment: document.getElementById("assessmentTutor").checked,
        interactive: document.getElementById("interactiveTutor").checked,
      };

      await submitOrder(orderData);
    };
  };

  const tutors = await fetchTutors();

  const applyFilters = () => {
    const filteredTutors = filterTutors(tutors);
    updateResultsTable(filteredTutors);
  };

  languageLevelInput.addEventListener("change", applyFilters);
  availableDaysInput.addEventListener("change", applyFilters);
  timeStartInput.addEventListener("input", applyFilters);
  timeEndInput.addEventListener("input", applyFilters);

  applyFilters();
});