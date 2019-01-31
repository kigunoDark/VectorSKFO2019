exports.get404 = (req, res) => {
    res.status(404).render('404',{
        pageTitle: "Страница не найдена",
        path: '/404',
        pageTipe: "error",
        isAuthenticated: req.isLoggedIn
    });
}