@echo off

title MCSynth Soundfont builder
echo MCSynth Soundfont builder
echo.
set /p sfile=Wave file to convert:
set /p sfname=Name your soundfont:

if exist %sfname%.error.log del %sfname%.error.log
if exist %sfname%.convert.log del /Q %sfname%.convert.log
set odir=respacks\%sfname%\assets\minecraft\sounds\note
mkdir %odir% 2> nul
echo Start processing...

echo { > respacks\%sfname%\pack.mcmeta
echo 	"pack":{ >> respacks\%sfname%\pack.mcmeta
echo 		"pack_format": 1, >> respacks\%sfname%\pack.mcmeta
echo 		"description": "%sfname%: An MCSynth Soundfont"  >> respacks\%sfname%\pack.mcmeta
echo 	} >> respacks\%sfname%\pack.mcmeta
echo } >> respacks\%sfname%\pack.mcmeta


echo { > respacks\%sfname%\assets\minecraft\sounds.json

:scanwav

for %%f in (%sfile%) do (
	rem read OTO
	if exist %sdir%\oto.ini (
		echo Reading OTO...
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
		echo Processing with OTO...
	) else (
		echo Processing...
	)

	for /l %%p in (0, 1, 7) do (
		rem resample
		if exist offset.txt (
			echo resampler %%f %odir%\%sfname%_%%p.wav F#%%p > cmdline.txt
			cmd /C helper.bat >>%sfname%.convert.log 2>>%sfname%.error.log
		) else (
			resampler %%f %odir%\%sfname%_%%p.wav F#%%p 100 N 0 500 >>%sfname%.convert.log 2>>%sfname%.error.log
		)

		if not exist %odir%\%sfname%_%%p.wav (
			echo Resampler failed on Pit %%p
			del cmdline.txt 2> nul
			del offset.txt 2> nul
			del consonant.txt 2> nul
			del cutoff.txt 2> nul
			del /Q %odir%\*.wav 2> nul
		) else (
			echo Resampler succeeded on Pit %%p
			rem convert to ogg
			oggenc2 -Q %odir%\%sfname%_%%p.wav >> %sfname%.convert.log

			del /Q %odir%\*.wav

			rem write to sounds.json

			echo 	"note.%sfname%.%%p": { >> respacks\%sfname%\assets\minecraft\sounds.json
			echo 		"category": "record", >> respacks\%sfname%\assets\minecraft\sounds.json
			echo 		"sounds": ["note/%sfname%_%%p"] >> respacks\%sfname%\assets\minecraft\sounds.json

			if %%p==7 (
				echo 	} >> respacks\%sfname%\assets\minecraft\sounds.json
			) else (
				echo 	}, >> respacks\%sfname%\assets\minecraft\sounds.json
			)
		)
	)
)


echo } >> respacks\%sfname%\assets\minecraft\sounds.json
echo Soundfont resourcepack creation completed.
echo Resourcepack is saved in the respacks folder.
if exist %sfname%.error.log echo Some errors occurred, please refer to %sfname%.error.log for more information

pause

