document.addEventListener("DOMContentLoaded", () => {
  const ordersPerPage = 5;
  let currentPage = 1;
  let globalOrders = [];
  let globalCourseMap = {};
  let globalTutorMap = {};

  async function fetchOrders() {
    try {
      const response = await fetch(
        "http://cat-facts-api.std-900.ist.mospolytech.ru/api/orders?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6"
      );
      if (!response.ok) throw new Error("Failed to fetch orders");

      globalOrders = await response.json();

      const tutors = await fetchTutors();

      await fetchCoursesAndRenderOrders(globalOrders, tutors);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }

  async function fetchTutors() {
    try {
      const response = await fetch(
        "http://cat-facts-api.std-900.ist.mospolytech.ru/api/tutors?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6"
      );
      if (!response.ok) throw new Error("Failed to fetch tutors");
      return await response.json();
    } catch (error) {
      console.error("Error fetching tutors:", error);
      return [];
    }
  }

  async function fetchCoursesAndRenderOrders(orders, tutors) {
    try {
      const response = await fetch(
        "http://cat-facts-api.std-900.ist.mospolytech.ru/api/courses?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6"
      );
      if (!response.ok) throw new Error("Failed to fetch courses");
      const courses = await response.json();

      globalCourseMap = courses.reduce((map, course) => {
        map[course.id] = course;
        return map;
      }, {});
      globalTutorMap = tutors.reduce((map, tutor) => {
        map[tutor.id] = tutor.name;
        return map;
      }, {});

      renderOrders(globalOrders, globalCourseMap, globalTutorMap);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  }

  function renderOrders(orders, courseMap, tutorMap) {
    const ordersTable = document.getElementById("orders-table");
    if (!ordersTable) return;

    const tbody = ordersTable.querySelector("tbody");
    tbody.innerHTML = "";

    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = Math.min(startIndex + ordersPerPage, orders.length);
    const currentOrders = orders.slice(startIndex, endIndex);

    if (currentOrders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">No orders yet.</td>
        </tr>`;
      return;
    }

    currentOrders.forEach((order, index) => {
      const courseName =
        order.course_id === 0
          ? "Tutor"
          : courseMap[order.course_id]?.name || "Unknown Course";

      const row = `
        <tr>
          <td>${startIndex + index + 1}</td>
          <td>${courseName}</td>
          <td>${order.date_start}</td>
          <td>${order.price} RUB</td>
          <td>
            <button class="btn btn-info btn-sm details-btn"
              data-bs-toggle="modal"
              data-bs-target="#detailsModal"
              data-order-id="${order.id}">Details</button>
            <button class="btn btn-warning btn-sm edit-btn"
              data-bs-toggle="modal"
              data-bs-target="#editModal"
              data-order-id="${order.id}">Edit</button>
            <button class="btn btn-danger btn-sm delete-btn"
              data-bs-toggle="modal"
              data-bs-target="#deleteModal"
              data-order-id="${order.id}">Delete</button>
          </td>
        </tr>`;
      tbody.innerHTML += row;
    });

    attachModalEventListeners(currentOrders, courseMap, tutorMap);
    renderPaginationControls(orders.length);
  }

  function renderPaginationControls(totalOrders) {
    const paginationContainer = document.getElementById("pagination-controls");
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(totalOrders / ordersPerPage);

    for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement("li");
      pageButton.className = `page-item ${i === currentPage ? "active" : ""}`;
      pageButton.innerHTML = `<button class="page-link">${i}</button>`;

      pageButton.addEventListener("click", () => {
        currentPage = i;
        renderOrders(globalOrders, globalCourseMap, globalTutorMap);
      });

      paginationContainer.appendChild(pageButton);
    }
  }

  function attachModalEventListeners(orders, courseMap, tutorMap) {
    document.querySelectorAll(".details-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const orderId = event.target.getAttribute("data-order-id");
        const order = orders.find((o) => o.id == orderId);
        const course = courseMap[order.course_id] || {};

        const isTutor = order.course_id === 0;
        const teacherName = isTutor
          ? tutorMap[order.tutor_id] || "Unknown Tutor"
          : course.teacher || "N/A";

        document.getElementById("detailsCourseName").textContent = isTutor
          ? "Tutor"
          : course.name || "Unknown Course";
        document.getElementById("detailsTeacher").textContent = teacherName;
        document.getElementById("detailsDescription").textContent = isTutor
          ? "Private tutoring session."
          : course.description || "No description available.";
        document.getElementById(
          "detailsPrice"
        ).textContent = `${order.price} RUB`;
        document.getElementById("detailsStartDate").textContent =
          order.date_start || "No start date available";
        document.getElementById("detailsTimeStart").textContent =
          order.time_start || "No time available";
        document.getElementById("detailsDuration").textContent = isTutor
          ? "N/A"
          : `${order.duration || 0} weeks`;
        document.getElementById("detailsPersons").textContent =
          order.persons || "1";
        document.getElementById("detailsSupplementary").textContent =
          order.supplementary ? "Yes" : "No";
        document.getElementById("detailsEarlyRegistration").textContent =
          order.earlyRegistration ? "Yes" : "No";
        document.getElementById("detailsGroupEnrollment").textContent =
          order.groupEnrollment ? "Yes" : "No";
        document.getElementById("detailsIntensiveCourse").textContent =
          order.intensiveCourse ? "Yes" : "No";
        document.getElementById("detailsPersonalized").textContent =
          order.personalized ? "Yes" : "No";
        document.getElementById("detailsExcursions").textContent =
          order.excursions ? "Yes" : "No";
        document.getElementById("detailsAssessment").textContent =
          order.assessment ? "Yes" : "No";
        document.getElementById("detailsInteractive").textContent =
          order.interactive ? "Yes" : "No";
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const orderId = event.target.getAttribute("data-order-id");
        const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
        confirmDeleteBtn.onclick = async () => {
          try {
            const response = await fetch(
              `http://cat-facts-api.std-900.ist.mospolytech.ru/api/orders/${orderId}?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6`,
              { method: "DELETE" }
            );
            if (!response.ok) throw new Error("Failed to delete order");
            alert("Order deleted successfully!");
            fetchOrders();
            const deleteModal = bootstrap.Modal.getInstance(
              document.getElementById("deleteModal")
            );
            deleteModal.hide();
          } catch (error) {
            console.error("Error deleting order:", error);
            alert("Failed to delete order. Please try again.");
          }
        };
      });
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const orderId = event.target.getAttribute("data-order-id");
        const order = orders.find((o) => o.id == orderId);
        const course = courseMap[order.course_id] || {};

        const isTutor = order.course_id === 0;
        const startDateTimeSelect = document.getElementById("startDateTime");
        const additionalFields = document.querySelectorAll(".additional-field");

        startDateTimeSelect.innerHTML = "";

        if (isTutor) {
          additionalFields.forEach((field) => (field.style.display = "none"));

          const datesAndTimes = [
            "2025-02-01T09:00",
            "2025-02-01T10:00",
            "2025-02-01T11:00",
            "2025-02-02T09:00",
            "2025-02-02T10:00",
            "2025-02-02T11:00",
          ];
          datesAndTimes.forEach((dateTime) => {
            const option = document.createElement("option");
            option.value = dateTime;
            option.textContent = new Date(dateTime).toLocaleString();
            startDateTimeSelect.appendChild(option);
          });

          document.getElementById("instructorName").value =
            tutorMap[order.tutor_id] || "Unknown Tutor";
          const cost = calculateTotalCostForTutors(tutor, selectedDateTime);
          document.getElementById("totalCost").value = `${cost} RUB`;
        } else {
          additionalFields.forEach((field) => (field.style.display = "block"));

          course.start_dates.forEach((dateTime) => {
            const option = document.createElement("option");
            option.value = dateTime;
            option.textContent = new Date(dateTime).toLocaleString();
            if (dateTime === `${order.date_start}T${order.time_start}`) {
              option.selected = true;
            }
            startDateTimeSelect.appendChild(option);
          });

          document.getElementById("applyCourseName").value =
            course.name || "Unknown Course";
          document.getElementById("instructorName").value =
            course.teacher || "N/A";
          document.getElementById("studentsNumber").value = order.persons || 1;
          document.getElementById("courseDuration").value = `${
            order.duration || 0
          } weeks`;
        }

        document.getElementById("supplementary").checked =
          order.supplementary || false;
        document.getElementById("personalized").checked =
          order.personalized || false;
        document.getElementById("excursions").checked =
          order.excursions || false;
        document.getElementById("assessment").checked =
          order.assessment || false;
        document.getElementById("interactive").checked =
          order.interactive || false;

        const selectedDateTime =
          startDateTimeSelect.value ||
          `${order.date_start}T${order.time_start}`;
        updateEndDateAndCost(course, selectedDateTime);

        startDateTimeSelect.addEventListener("change", () => {
          updateEndDateAndCost(course, startDateTimeSelect.value);
        });

        document
          .querySelectorAll("input[type='checkbox'], #studentsNumber")
          .forEach((input) => {
            input.addEventListener("change", () => {
              updateEndDateAndCost(course, startDateTimeSelect.value);
            });
          });

        const form = document.getElementById("applyForm");
        form.onsubmit = async (e) => {
          e.preventDefault();

          const updatedOrder = {
            course_id: order.course_id,
            date_start: startDateTimeSelect.value.split("T")[0],
            time_start: startDateTimeSelect.value.split("T")[1],
            persons: parseInt(document.getElementById("studentsNumber").value),
            duration: parseInt(order.duration),
            supplementary: document.getElementById("supplementary").checked,
            personalized: document.getElementById("personalized").checked,
            excursions: document.getElementById("excursions").checked,
            assessment: document.getElementById("assessment").checked,
            interactive: document.getElementById("interactive").checked,
            price: calculateTotalCost(course, startDateTimeSelect.value),
          };

          try {
            const response = await fetch(
              `http://cat-facts-api.std-900.ist.mospolytech.ru/api/orders/${orderId}?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedOrder),
              }
            );
            if (!response.ok) throw new Error("Failed to update order");

            alert("Order updated successfully!");
            fetchOrders();
            const editModal = bootstrap.Modal.getInstance(
              document.getElementById("editModal")
            );
            editModal.hide();
          } catch (error) {
            console.error("Error updating order:", error);
            alert("Failed to update order. Please try again.");
          }
        };
      });
    });
  }

  function updateEndDateAndCost(course, selectedDateTime) {
    const courseDurationWeeks = course.total_length || 0;
    const selectedDate = new Date(selectedDateTime);
    const endDate = new Date(selectedDate);
    endDate.setDate(selectedDate.getDate() + courseDurationWeeks * 7);
    document.getElementById("endDate").value = endDate.toLocaleDateString();
    const cost = calculateTotalCost(course, selectedDateTime);
    document.getElementById("totalCost").value = `${cost} RUB`;
  }

  function calculateTotalCost(course, selectedDateTime) {
    const studentsNumber =
      parseInt(document.getElementById("studentsNumber").value) || 1;
    const isWeekendOrHoliday = [0, 6].includes(
      new Date(selectedDateTime).getDay()
    )
      ? 1.5
      : 1;
    const startTime = new Date(selectedDateTime).getHours();
    const morningSurcharge = startTime >= 9 && startTime <= 12 ? 400 : 0;
    const eveningSurcharge = startTime >= 18 && startTime <= 20 ? 1000 : 0;
    let totalCost =
      course.course_fee_per_hour *
      course.total_length *
      course.week_length *
      isWeekendOrHoliday;
    const discountMessage = document.getElementById("discountMessage");
    discountMessage.innerHTML = "";
    if (new Date() < new Date(course.start_dates[0])) {
      totalCost *= 0.9;
      discountMessage.innerHTML +=
        "10% Early Registration Discount applied.<br>";
    }

    if (studentsNumber >= 5) {
      totalCost *= 0.85;
      discountMessage.innerHTML += "15% Group Enrollment Discount applied.<br>";
    }

    if (course.week_length > 20) {
      totalCost *= 1.2;
      discountMessage.innerHTML += "20% Intensive Course Fee added.<br>";
    }
    if (document.getElementById("supplementary").checked)
      totalCost += 2000 * studentsNumber;
    if (document.getElementById("personalized").checked)
      totalCost += 1500 * course.total_length;
    if (document.getElementById("excursions").checked) totalCost *= 1.25;
    if (document.getElementById("assessment").checked) totalCost += 300;
    if (document.getElementById("interactive").checked) totalCost *= 1.5;
    return Math.round(
      (totalCost + morningSurcharge + eveningSurcharge) * studentsNumber
    );
  }

  function calculateTotalCostForTutors(tutor, selectedDateTime) {
    const studentsNumber =
      parseInt(document.getElementById("studentsNumber").value) || 1;
    const isWeekendOrHoliday = [0, 6].includes(
      new Date(selectedDateTime).getDay()
    )
      ? 1.5
      : 1;
    const startTime = new Date(selectedDateTime).getHours();
    const morningSurcharge = startTime >= 9 && startTime <= 12 ? 400 : 0;
    const eveningSurcharge = startTime >= 18 && startTime <= 20 ? 1000 : 0;

    let totalCost = tutor.price_per_hour * isWeekendOrHoliday;

    const discountMessage = document.getElementById("discountMessage");
    discountMessage.innerHTML = "";

    const daysBeforeSession =
      (new Date(selectedDateTime) - new Date()) / (1000 * 60 * 60 * 24);
    if (daysBeforeSession > 30) {
      totalCost *= 0.9;
      discountMessage.innerHTML +=
        "10% Early Registration Discount applied.<br>";
    }

    if (studentsNumber >= 5) {
      totalCost *= 0.85;
      discountMessage.innerHTML += "15% Group Enrollment Discount applied.<br>";
    }

    if (document.getElementById("supplementary").checked)
      totalCost += 2000 * studentsNumber;
    if (document.getElementById("excursions").checked) totalCost *= 1.25;
    if (document.getElementById("assessment").checked) totalCost += 300;
    if (document.getElementById("interactive").checked) totalCost *= 1.5;

    totalCost += morningSurcharge + eveningSurcharge;

    return Math.round(totalCost * studentsNumber);
  }

  if (window.location.pathname.includes("account.html")) {
    fetchOrders();
  }
});