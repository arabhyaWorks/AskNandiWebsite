import React, { useState, useEffect } from "react";
import axios from "axios";
import "./chatbot.css";
import closeButton from "../assets/closeBtn.svg";
import logo from "../assets/logo.jpg";
import bhasiniLogo from "../assets/bhasini.png";

import Header from "./header/index.jsx";
import ChatCont from "./chatcont";
import Footer from "./footer";
// const endpoint = "http://localhost:5001";

import database from "../../firebase.js";
import { set, ref, push, update, child, onValue, get } from "firebase/database";

// const endpoint = "https://shimmering-alder-shock.glitch.me";
const endpoint = "https://broadleaf-bright-flavor.glitch.me"

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [userState, setUserState] = useState({});
  const [userLanguage, setUserLanguage] = useState("en");
  const [userName, setUserName] = useState("Devotee");
  const [interactivePayload, setInteractivePayload] = useState(null);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [someData, setSomeData] = useState(null);

  useEffect(() => {
    console.log(messages);
  }, [messages]);

  // Log all state variables whenever they change
  useEffect(() => {}, [
    messages,
    input,
    sessionId,
    userState,
    userLanguage,
    userName,
    interactivePayload,
    isAskingQuestion,
  ]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await axios.post(endpoint + "/api/flow", {
          userName,
          messageType: "text",
          messageContent: "hi",
          userState,
          userLanguage,
        });

        const { headers, data } = response;
        // console.log("Response data:", data); // Log response data
        setSessionId(headers["session-id"]);
        const messages = data.messages.flat(); // Flatten the array if needed
        setMessages(messages);

        // Check if the response should set isAskingQuestion to true
        if (data.list_reply && data.list_reply.id === "ask_yes") {
          setIsAskingQuestion(true);
        }

        // Update userState based on server response if needed
        setUserState(data.userState || {});
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchInitialData();
    // console.log("Initial data fetched");
    // gothit();
  }, [someData]); // Only depend on userName and userLanguage

  const sendMessage = async () => {
    let messageType = "text";
    let messageContent = input;

    if (input !== "") {
      const replyMessage = {
        type: "reply",
        text: {
          body: input,
        },
      };

      // Wrap replyMessage in an array before spreading
      setMessages((prevMessages) => [...prevMessages, replyMessage]);
    }

    setInput("");

    //   {
    //     "type": "list_reply",
    //     "list_reply": {
    //         "id": "lang_en"
    //     }
    // }

    if (interactivePayload) {
      messageType = "interactive";
      messageContent = interactivePayload;
      console.log("Interactive payload:", interactivePayload);

      if (
        interactivePayload &&
        interactivePayload.list_reply &&
        interactivePayload.list_reply.id.startsWith("lang_")
      ) {
        // setUserLanguage(interactivePayload.list_reply.id.slice(-2));
        console.log(
          "State",
          userLanguage,
          "current selected langu",
          interactivePayload.list_reply.id.slice(5)
        );
        setUserLanguage(interactivePayload.list_reply.id.slice(5));
      }

      setInteractivePayload(null); // Clear the interactive payload after sending
    }

    const updatedUserState = isAskingQuestion
      ? { ...userState, isAskingQuestion: true }
      : userState;

    const payload = {
      userName,
      messageType,
      messageContent,
      userState: updatedUserState,
      userLanguage,
    };

    if (
      interactivePayload &&
      interactivePayload.list_reply &&
      interactivePayload.list_reply.id === "ask_yes"
    ) {
      setIsAskingQuestion(true);
    }

    try {
      const response = await axios.post(endpoint + "/api/flow", payload, {
        headers: { "session-id": sessionId },
      });

      if (isAskingQuestion) {
        setIsAskingQuestion(false);
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        ...response.data.messages,
      ]);
      // setInput("");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // const handleRadioClick = (option) => {
  //   // setInput(option.reply.title);

  //   setInteractivePayload({
  //     type: "list_reply",
  //     list_reply: { id: option.reply.id },
  //   });

  //   const data = {
  //     sessionId: "0f4dd371-a675-4489-8965-1e0eeaa07d9f",
  //     type: "text",
  //     text: {
  //       body: "Do you want to go back to the main menu?",
  //     },
  //   };

  //   const replyMessage = {
  //     sessionId: "0f4dd371-a675-4489-8965-1e0eeaa07d9f",
  //     type: "reply",
  //     text: {
  //       body: option.reply.id,
  //     },
  //   };

  //   setMessages((prevMessages) => [...prevMessages, ...replyMessage]);
  // };

  const handleRadioClick = (option) => {
    setInteractivePayload({
      type: "list_reply",
      list_reply: { id: option.reply.id },
    });

    const replyMessage = {
      // sessionId: "0f4dd371-a675-4489-8965-1e0eeaa07d9f",
      type: "reply",
      text: {
        body: option.reply.title,
      },
    };

    // Wrap replyMessage in an array before spreading
    setMessages((prevMessages) => [...prevMessages, replyMessage]);
  };

  function gothit() {
    const dbRef = ref(database);
    var data = [];
    // console.log("htitting database");

    get(child(dbRef, `ask_nandi_web/hit`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const value = parseInt(snapshot.val());
          // console.log(`${options} value:`, value);
          data.push(value + 1);
          // console.log(
          //   "increasing: ",
          //   value + 1,
          //   " array: ",
          //   data,
          //   "length :",
          //   data.length,
          //   "last element: ",
          //   data[data.length - 1]
          // );

          // console.log("perfoming actions");
          console.log("data:", data[0]);
          if (data.length > 0) {
            set(ref(database, `ask_nandi_web/hit`), data[data.length - 1]);
          } else {
            set(ref(database, `ask_nandi_web/hit`), 1);
          }
        } else {
          set(ref(database, `ask_nandi_web/hit`), 1);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  useEffect(() => {
    if (interactivePayload) {
      sendMessage(interactivePayload.list_reply.id);
    }
  }, [interactivePayload]);

  return (
    <div className="container">
      <ChatCont
        setInput={setInput}
        sendMessage={sendMessage}
        messages={messages}
        handleRadioClick={handleRadioClick}
        isAskingQuestion={isAskingQuestion}
      />
      <Footer
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        closeButton={closeButton}
        logo={logo}
        bhasiniLogo={bhasiniLogo}
      />
    </div>
  );
};

export default Chatbot;
