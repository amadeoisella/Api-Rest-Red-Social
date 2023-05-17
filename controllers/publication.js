//acciones de prueba
const testPublication = (req, res) => {
  return res.status(200).send({
    message: "message sent from: controllers/publication.js",
  });
};

//exportar acciones
module.exports = {
  testPublication,
};
