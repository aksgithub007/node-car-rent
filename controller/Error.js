exports.get404Page = (req, res, next) => {
    res.render("404",{
        isLoggedIn: req.session.isLoggedIn,
        isAdmin: req.session.user && req.session.user.role === 'admin',
        csrfToken: req.csrfToken(),
        path: "/404"
    })
}