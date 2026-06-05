exports.isAuth = (req, res, next) => {
    if(!req.session.isLoggedIn){
       return  res.redirect("/admin/signin")
    }
    next()
}

