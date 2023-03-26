document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('click', function() {
            const projectId = card.getAttribute('data-project');
            window.open(`project-details.html?project=${projectId}`, '_blank');
        });
    });
});
