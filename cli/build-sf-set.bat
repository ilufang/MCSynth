@echo off

title MCSynth Soundfont builder
echo MCSynth Soundfont builder
echo.
cd voice
dir
set /p sdir=Name of Voicebank to convert:
set /p sfname=Name your soundfont:
cd ..
mkdir temp 2> nul
mkdir temp\failed 2> nul
xcopy voice\%sdir% temp\ /E /Q /R /H > nul
set sdir=temp
del /Q temp\*_.wav

if exist %sfname%.error.log del %sfname%.error.log
if exist %sfname%.convert.log del /Q %sfname%.convert.log
set odir=respacks\%sfname%\assets\minecraft\sounds\note\%sfname%
mkdir %odir%\temp 2> nul
echo Start processing...

echo { > respacks\%sfname%\pack.mcmeta
echo "pack":{ >> respacks\%sfname%\pack.mcmeta
echo "pack_format": 1, >> respacks\%sfname%\pack.mcmeta
echo "description": "%sfname%: Am MCSynth Soundfont",  >> respacks\%sfname%\pack.mcmeta
echo } >> respacks\%sfname%\pack.mcmeta
echo } >> respacks\%sfname%\pack.mcmeta

echo { > respacks\%sfname%\assets\minecraft\sounds.json
echo lock > kill.lock
start resampkiller.bat

:scanwav

for %%f in (%sdir%\*.wav) do (
	echo Incoming file: %%~nf
  	rem Generate freq map if necessary
	if not exist %sdir%\%%~nf_wav.frq (
		resampler %%f nul 100 100 GN 0 100
		echo Generating freq map for %%~nf
	)
	rem read OTO
	if exist %sdir%\oto.ini (
		for /F "tokens=*" %%l in (%sdir%\oto.ini) do (
			for /F "tokens=1 delims==" %%e in ("%%l") do (
				if %%e==%%~nf.wav (
					for /F "tokens=2 delims=," %%v in ("%%l") do (echo %%v > offset.txt)
					for /F "tokens=3 delims=," %%v in ("%%l") do (echo %%v > consonant.txt)
					for /F "tokens=4 delims=," %%v in ("%%l") do (echo %%v > cutoff.txt)
				)
			)
		)
	)

	if exist offset.txt (
		echo Processing %%~nf with OTO...
	) else (
		echo Processing %%~nf...
	)

	copy %%f tempin.wav > nul
	for /l %%p in (0, 1, 7) do (
		rem resample
		if exist offset.txt (
			echo resampler tempin.wav tempout.wav F#%%p > cmdline.txt
			cmd /C helper.bat >>%sfname%.convert.log 2>>%sfname%.error.log
		) else (
			resampler tempin.wav tempout.wav F#%%p 200 >>%sfname%.convert.log 2>>%sfname%.error.log
		)
		rem resampler succeeded, cleanup

		if not exist tempout.wav (
			copy %%f temp\failed\ > nul
			echo Resampler failed on %%~nf Pit %%p
			echo Resampler failed on %%~nf. >> %sfname%.errors.log
			del cmdline.txt 2> nul
			del offset.txt 2> nul
			del consonant.txt 2> nul
			del cutoff.txt 2> nul
			del /Q %odir%\*.wav 2> nul
			del /Q %odir%\temp\* 2> nul
		) else (
			copy tempout.wav %odir%\temp\fourtick.wav > nul
			del tempout.wav
			echo Resampler succeeded on %%~nf Pit %%p
			rem extract
			wavtool %odir%\temp\head.wav %odir%\temp\fourtick.wav 0   60 0 5 35 0 100 100 0 0 >> %sfname%.convert.log
			copy /Y %odir%\temp\head.wav.whd /B + %odir%\temp\head.wav.dat /B %odir%\head_%%~nf_%%p.wav >> %sfname%.convert.log
			oggenc2 -Q %odir%\head_%%~nf_%%p.wav >> %sfname%.convert.log

			wavtool %odir%\temp\body.wav %odir%\temp\fourtick.wav 100 60 0 5 35 0 100 100 0 0 >> %sfname%.convert.log
			copy /Y %odir%\temp\body.wav.whd /B + %odir%\temp\body.wav.dat /B %odir%\body_%%~nf_%%p.wav >> %sfname%.convert.log
			oggenc2 -Q %odir%\body_%%~nf_%%p.wav >> %sfname%.convert.log

			del /Q %odir%\*.wav
			del /Q %odir%\temp\*

			rem write to sounds.json

			echo "note.%sfname%.%%p_%%~nf": { >> respacks\%sfname%\assets\minecraft\sounds.json
			echo 	"category": "record", >> respacks\%sfname%\assets\minecraft\sounds.json
			echo 	"sounds": ["%sfname%/head_%%~nf_%%p.ogg"] >> respacks\%sfname%\assets\minecraft\sounds.json
			echo }, >> respacks\%sfname%\assets\minecraft\sounds.json

			echo "note.%sfname%._%%p_%%~nf: {" >> respacks\%sfname%\assets\minecraft\sounds.json
			echo 	"category": "record", >> respacks\%sfname%\assets\minecraft\sounds.json
			echo 	"sounds": ["%sfname%/body_%%~nf_%%p.ogg"] >> respacks\%sfname%\assets\minecraft\sounds.json
			echo }, >> respacks\%sfname%\assets\minecraft\sounds.json
		)
	)
)

if exist %sdir%\failed\*.wav (
	xcopy %sdir%\failed %sdir%  /E /Q /R /H > nul
	rmdir /Q /S %sdir%\failed
)

del kill.lock
del tempin.wav
rmdir /S /Q temp
echo } >> respacks\%sfname%\assets\minecraft\sounds.json
echo Soundfont resourcepack creation completed.
echo Resourcepack is saved in the respacks folder.
if exist %sfname%.error.log echo Some errors occurred, please refer to %sfname%.error.log for more information

pause
goto :EOF

:truncAndConvert

goto :EOF
