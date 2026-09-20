exports.home = (req, res) => res.render('home', { title: 'Inicio' });
exports.menu = (req, res) => res.render('menu', { title: 'Menú y pedidos' });
exports.about = (req, res) => res.render('about', { title: 'Nosotros' });
