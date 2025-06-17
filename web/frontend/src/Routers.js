//Routes
/* eslint-disable */
import {Route, Routes} from "react-router-dom";
import Home from "./app/page";


export default function Routers() {
    return(
        <Routes>
            <Route path="/" element={<Home />} />
        </Routes>
    )
}
