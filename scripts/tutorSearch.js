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
      if (!response.ok) throw new Error("Failed to fetch tutors");
      return await response.json();
    } catch (error) {
      console.error("Error fetching tutors:", error);
      return [];
    }
  };

  const filterTutors = (tutors) => {
    const level = languageLevelInput?.value?.toLowerCase() || "all";
    const day = availableDaysInput?.value || "all";
    const timeStart = timeStartInput?.value || "";
    const timeEnd = timeEndInput?.value || "";

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
        if (searchModal) searchModal.hide();
      });
    });
  };

  const openBookingModal = (tutorName, tutorPrice, tutorId) => {
    const tutorNameInput = document.getElementById("selectedTutorName");
    const startDateSelect = document.getElementById("startDateTutor");
    const startTimeSelect = document.getElementById("startTimeTutor");

    if (!tutorNameInput || !startDateSelect || !startTimeSelect) {
      console.error("Required elements not found in the DOM.");
      return;
    }

    tutorNameInput.value = tutorName;

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

    const calculatePrice = (basePrice, options, selectedDate) => {
      let price = basePrice;

      if (new Date(selectedDate) - new Date() > 30 * 24 * 60 * 60 * 1000) {
        price *= 0.9;
        document.getElementById("discountMessageTutor").innerHTML =
          "10% Early Registration Discount applied.<br>";
      } else {
        document.getElementById("discountMessageTutor").innerHTML = "";
      }

      if (options.supplementary) price += 2000; 
      if (options.excursions) price *= 1.25;
      if (options.assessment) price += 300; 
      if (options.interactive) price *= 1.5;

      return price;
    };

    const updatePrice = () => {
      const options = {
        supplementary: document.getElementById("supplementaryTutor").checked,
        excursions: document.getElementById("excursionsTutor").checked,
        assessment: document.getElementById("assessmentTutor").checked,
        interactive: document.getElementById("interactiveTutor").checked,
      };

      const selectedDate = startDateSelect.value;
      const basePrice = parseFloat(tutorPrice);
      const finalPrice = calculatePrice(basePrice, options, selectedDate);
      document.getElementById(
        "finalPriceDisplay"
      ).innerHTML = `Final Price: ${finalPrice.toFixed(2)} RUB`;
    };

    ["supplementaryTutor", "excursionsTutor", "assessmentTutor", "interactiveTutor"].forEach((id) =>
      document.getElementById(id)?.addEventListener("change", updatePrice)
    );

    startDateSelect.addEventListener("change", updatePrice);

    updatePrice();

    const submitOrder = async (orderData) => {
      try {
        const response = await fetch(
          `http://cat-facts-api.std-900.ist.mospolytech.ru/api/orders?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to submit order");
        }

        alert("Order submitted successfully!");
      } catch (error) {
        console.error("Error submitting order:", error);
        alert("Failed to submit order. Please try again.");
      }
    };

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
        duration: 1,
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

  ["change", "input"].forEach((event) => {
    languageLevelInput.addEventListener(event, applyFilters);
    availableDaysInput.addEventListener(event, applyFilters);
    timeStartInput.addEventListener(event, applyFilters);
    timeEndInput.addEventListener(event, applyFilters);
  });

  applyFilters();
});