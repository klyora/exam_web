document
  .getElementById("applyForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const applyCourseName = document.getElementById("applyCourseName").value;
    const instructorName = document.getElementById("instructorName").value;
    const startDate = document.getElementById("startDate").value;
    const startTime = document.getElementById("startTime").value;
    const studentsNumber =
      parseInt(document.getElementById("studentsNumber").value) || 1;
    const courseDuration = document
      .getElementById("courseDuration")
      .value.split(" ")[0];
    const totalCost = parseInt(
      document.getElementById("totalCost").value.replace("RUB", "").trim()
    );

    const courseId = 1;
    const tutorId = 1;

    const requestData = {
      course_id: courseId,
      tutor_id: tutorId,
      date_start: startDate,
      time_start: startTime,
      duration: parseInt(courseDuration),
      persons: studentsNumber,
      price: totalCost,
    };

    try {
      const response = await fetch(
        `http://cat-facts-api.std-900.ist.mospolytech.ru/api/orders?api_key=1351c78e-5afb-4126-9d17-5925335ee1e6`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Failed to submit the application");
      }

      alert("Application submitted successfully!");
      const form = document.getElementById("applyForm");
      form.reset();
      document.getElementById("totalCost").value = "";
      const modal = document.getElementById("applyModal");
      const modalInstance = bootstrap.Modal.getInstance(modal);
      modalInstance.hide();
    } catch (error) {
      alert("Failed to submit the application. Please try again.");
    }
  });