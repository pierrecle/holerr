import classes from "./Preset.module.scss";
import { ChangeEvent, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, Checkbox, Chip, FormControl, FormHelperText, IconButton, Input, InputAdornment, InputLabel, MenuItem, Select, TextField } from "@material-ui/core";
import { useTranslation } from "react-i18next";
import httpApi from "../../api/http";
import {Delete as DeleteIcon, Save as SaveIcon} from "@material-ui/icons";
import { Preset as PresetType } from "../../models/presets.type";
import DeletePresetDialog from "./DeletePresetDialog";
import { Autocomplete } from "@material-ui/lab";

type PresetProps = {
    preset: PresetType,
    onDelete: () => void
};

const ALL_EXTENSIONS = "___all___";

const Preset:React.FC<PresetProps>= ({preset, onDelete}) => {
    const {t} = useTranslation();
    const [changed, setChanged] = useState(false);
    const [displayName, setDisplayName] = useState(preset.name);
    const [name, setName] = useState(preset.name);
    const [watchDir, setWatchDir] = useState(preset.watch_dir);
    const [outputDir, setOutputDir] = useState(preset.output_dir);
    const [minFileSizeStr, setMinFileSizeStr] = useState(""+preset.min_file_size);
    const [minFileSizeUnit, setMinFileSizeUnit] = useState(1);
    const [createSubDir, setCreateSubDir] = useState(preset.create_sub_dir);
    const [extensions, setExtensions] = useState(preset.file_extensions || [ALL_EXTENSIONS]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const cleanMinFileSize = () => {
        const minFileSize = minFileSizeStr.length > 0 ? parseInt(minFileSizeStr, 10) :  0;
        if (minFileSize > 0) {
            let tmpFileSize = minFileSize * minFileSizeUnit;
            let curUnit = 1e12;
            while(!Number.isInteger(tmpFileSize/curUnit)) {
                curUnit /= 1e3;
            }
            setMinFileSizeStr(""+(tmpFileSize/curUnit));
            setMinFileSizeUnit(curUnit);
        } else {
            setMinFileSizeUnit(1);
        }

        if( minFileSizeStr.length === 0) {
            setMinFileSizeStr("0");
        }
    };

    useEffect(cleanMinFileSize, [preset.min_file_size]);

    const handleDelete = async () => {
        setShowDeleteDialog(false);
        await httpApi.delete(`/presets/${displayName.replace("/", "%2F")}`);
        onDelete();
    };

    const handleUpdate = async () => {
        const minFileSize = minFileSizeStr.length > 0 ? parseInt(minFileSizeStr, 10) :  0;
        const exts = [...extensions];
        if (exts.indexOf(ALL_EXTENSIONS) >= 0) {
            exts.splice(exts.indexOf(ALL_EXTENSIONS), 1);
        }

        await httpApi.patch(`/presets/${displayName.replace("/", "%2F")}`, {
            name,
            watch_dir: watchDir,
            output_dir: outputDir,
            min_file_size: minFileSize*minFileSizeUnit,
            create_sub_dir: createSubDir,
            file_extensions: exts.length ? exts : null
        });
        setDisplayName(name);
        setChanged(false);

        cleanMinFileSize();
    };

    const handleUpdateName = (e:ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        setChanged(true);
    };

    const handleUpdateWatchDir = (e:ChangeEvent<HTMLInputElement>) => {
        setWatchDir(e.target.value);
        setChanged(true);
    };

    const handleUpdateOutputDir = (e:ChangeEvent<HTMLInputElement>) => {
        setOutputDir(e.target.value);
        setChanged(true);
    };

    const handleUpdateMinFileSize = (e:ChangeEvent<HTMLInputElement>) => {
        setMinFileSizeStr(e.target.value);
        setChanged(true);
    };

    const handleChangeMinFileSizeUnit = (e:ChangeEvent<{ value: unknown }>) => {
        setMinFileSizeUnit(parseInt(e.target.value as string, 10));
        setChanged(true);
    }

    const handleUpdateCreateSubDir = (e:ChangeEvent<HTMLInputElement>) => {
        setCreateSubDir(e.target.checked);
        setChanged(true);
    };

    const handleUpdateExtensions = (e:ChangeEvent<{ }>, value: string[]) => {
        if(value.indexOf(ALL_EXTENSIONS) >= 0) {
            value.splice(value.indexOf(ALL_EXTENSIONS), 1);
        }
        setExtensions(value.length === 0 ? [ALL_EXTENSIONS] : value);
        setChanged(true);
    };

    return <Card>
    <CardHeader
        title={displayName}
        action={<div>
            {changed ? <IconButton aria-label="Save" onClick={handleUpdate} color="secondary" size="small">
                <SaveIcon />
            </IconButton> : null}
            <IconButton aria-label="Delete" onClick={() => setShowDeleteDialog(true)} size="small">
                <DeleteIcon />
            </IconButton>
        </div>}
    >
    </CardHeader>
    <CardContent className={classes.cardContent}>
        <TextField
            label={t("presets.name")}
            defaultValue={name}
            onChange={handleUpdateName}
            fullWidth={true} />
        <TextField
            label={t("presets.watch_dir")}
            defaultValue={watchDir}
            onChange={handleUpdateWatchDir}
            fullWidth={true} />
        <TextField
            label={t("presets.output_dir")}
            defaultValue={outputDir}
            onChange={handleUpdateOutputDir}
            fullWidth={true} />
        <Autocomplete multiple
            options={[] as string[]} freeSolo
            value={extensions}
            onChange={handleUpdateExtensions}
            renderTags={(value: string[], getTagProps) =>
                value.map((option: string, index: number) => option === ALL_EXTENSIONS ? <Chip variant="outlined" label={t("presets.all")} key={index} /> : <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
            }
            renderInput={(params) => (
                <TextField {...params} label={t("presets.file_extensions")} fullWidth />
            )}
        />
        <FormControl fullWidth={true} >
          <InputLabel htmlFor={`preset-min-file-size-${preset.name}`}>{t("presets.min_file_size")}</InputLabel>
          <Input
            id={`preset-min-file-size-${preset.name}`}
            value={minFileSizeStr}
            onChange={handleUpdateMinFileSize}
            endAdornment={<InputAdornment position="end">
                <Select onChange={handleChangeMinFileSizeUnit} value={minFileSizeUnit}>
                  <MenuItem value={1e12}>{t("units.TB")}</MenuItem>
                  <MenuItem value={1e9}>{t("units.GB")}</MenuItem>
                  <MenuItem value={1e6}>{t("units.MB")}</MenuItem>
                  <MenuItem value={1e3}>{t("units.KB")}</MenuItem>
                  <MenuItem value={1}>{t("units.B")}</MenuItem>
                </Select>
              </InputAdornment>
            }
          />
          <FormHelperText>{t("presets.min_file_size_hint")}</FormHelperText>
        </FormControl>
        <InputLabel>
            <Checkbox checked={createSubDir} onChange={handleUpdateCreateSubDir} /> {t("presets.create_sub_dir")}
        </InputLabel>
    </CardContent>
    <DeletePresetDialog open={showDeleteDialog} onCancel={() => setShowDeleteDialog(false)} onConfirm={handleDelete} presetName={displayName} />
</Card>;
}

export default Preset;