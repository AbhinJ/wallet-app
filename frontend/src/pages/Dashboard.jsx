import { Appbar } from "../components/Appbar";
import { Balance } from "../components/Balance";
import { Users } from "../components/Users";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [firstLetter, setFirstLetter] = useState("");

  async function getUser() {
    const response = await axios.get("http://localhost:3000/api/v1/user/me", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    setBalance(response.data.balance);
    setFirstLetter(response.data.firstName[0].toUpperCase());
  }
  async function extractUser() {
    if (localStorage.getItem("token")) {
      const response = await axios.get("http://localhost:3000/api/v1/user", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      if (response.status == 200) {
        getUser();
      }
    } else {
      navigate("/signin");
    }
  }

  useEffect(() => {
    extractUser();
  }, []);
  return (
    <div>
      <Appbar firstLetter={firstLetter} />
      <div className="m-8">
        <Balance value={parseInt(balance)} />
        <Users />
      </div>
    </div>
  );
};
