//importar dependencias
const express = require("express");
const cors = require("cors");
const connection = require("./database/connection");

//crear servidor node
const app = express();
const PORT = process.env.PORT || 8080;

//configurar cors
//convertir los datos del body a objetos js
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//conexion db
connection();

//cargar conf rutas
const UserRoutes = require("./routes/user");
const PublicationRoutes = require("./routes/publication");
const FollowRoutes = require("./routes/follow");

//routes
app.use("/api/user", UserRoutes);
app.use("/api/publication", PublicationRoutes);
app.use("/api/follow", FollowRoutes);

//poner servidor a escuchar
app.listen(PORT, () => {
  console.log(`app listened on port http://localhost:${PORT}`);
});
