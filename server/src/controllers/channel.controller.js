import Channel from "../models/channel.model.js";

export const createChannel = async (req, res) => {
  try {
    const userId = req.userId;
    let { channelName } = req.body;

    let existChannel = await Channel.findOne({ channelName });

    if (existChannel) {
      let suffix = 1;
      let newName = `${channelName}-${suffix}`;

      // Keep increasing until a free name is found
      while (await Channel.findOne({ channelName: newName })) {
        suffix++;
        newName = `${channelName}-${suffix}`;
      }

      channelName = newName; // final unique name
    }

    // Create Channel
    const newChannel = await Channel.create({
      userId,
      channelName
    });

    res.status(201).json({
      success: true,
      channelName: newChannel
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const listChannels  = async (req, res) => {
  const channels = await Channel.find().populate("userId", "username email");
  res.status(200).json(channels);
}
