# MCSynth

A command-block-based in-game music synthesizer

**代码整理优化中,目前版本尚无法运行,请期待更新,谢谢!**

**W.I.P, No working release is available yet.**

## About

This project helps you build beautiful music tracks in Minecraft. It works as resource pack command blocks inside your world. Similar to the trail of noteblocks generated by the NoteBlock Studio, this project builds you better-looking tracks without having to edit your gamesaves. Instead of redstone repeaters and noteblocks, we use purely command blocks to `/playsound` as well as do the timing. This enables more accurate timing (20 ticks per second) and a wider variety of sounds (through `/playsound`). Resource packs can be used to add custom instrument or even vocal. Standalone code will be used to help you create the resource pack.

## Setup

This project works as "One-Command mod", however, as the code is very long, the setup is divided into several command blocks:

1. Place a command block in an open area (nothing above it). Make sure it is in your **Spawn chunk** (Where you are when you create a world).
2. Copy&Paste **`MCSynth`** into it and activate by placing a redstone torch to the **side**. Do **NOT** place anything (button/lever/pressure plate/yourself) on the top of it.
3. After the machine is assembled, a welcome message should appear in the chat. You should see an "abnormal" command block with a sign "Place Piano Roll Code Here" on it.
4. Copy&Paste **`PianoRoll`** into it.
5. Look around and look for a single command block. It should be located within 6 blocks in positive Z direction.
6. Copy&Paste soundfont code into it and activate in the same way as Step2. Find more about soundfonts in the [Soundfonts](#SoundFonts) section
7. If you need multiple soundfonts, continue installation. You can always find a commandblock placed for you in the Z+ direction.
