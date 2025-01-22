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
    selectButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tutorId = btn.getAttribute("data-id");
        const tutorName = btn.getAttribute("data-name");
        const tutorPrice = btn.getAttribute("data-price");

        const searchModal = bootstrap.Modal.getInstance(
          document.getElementById("tutorSearchModal")
        );
        if (searchModal) {
          searchModal.hide();
        }

        openBookTutorModal(tutorId, tutorName, tutorPrice);
      });
    });
  };

  const openBookTutorModal = (tutorId, tutorName, tutorPrice) => {
    const tutor = {
      id: tutorId,
      name: tutorName,
      price_per_hour: Number(tutorPrice),
    };

    if (typeof setupBookingForm === "function") {
      setupBookingForm(tutor);
    } else {
      console.error("Function setupBookingForm not defined!");
      return;
    }

    const bookTutorModalElem = document.getElementById("bookTutorModal");
    if (bookTutorModalElem) {
      const bookingModal = new bootstrap.Modal(bookTutorModalElem);
      bookingModal.show();
    } else {
      console.error("Элемент bookTutorModal не найден в DOM");
    }
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
