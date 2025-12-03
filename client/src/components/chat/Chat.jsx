import { useOutletContext } from "react-router-dom";

const Chat = () => {
  const { currentChannel } = useOutletContext();

  return (
    <div>
      {currentChannel ? (
        <h2>Current Channel: {currentChannel.channelName}        
        </h2>
      ) : (
        <h2>Please select a channel</h2>
      )}
    </div>
  );
};

export default Chat;
