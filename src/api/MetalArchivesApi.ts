import {
	request
} from 'obsidian';

import * as cheerio from 'cheerio';

interface Song {
	title: string,
	length: string,
	lyrics: string
}

interface Album {
	name: string,
	band: string,
	type: string,
	year: string,
	date: string,
	label: string,
	format: string,
	cover: string,
	songs: Array<Song>
}

interface Artist {
	name: string,
	role: string
}

interface Band {
	name: string,
	status: string,
	country: string,
	formedYear: string,
	yearsActive: string,
	genre: Array<string>,
	themes: Array<string>,
	currentLabel: string,
	description: string,
	discography: Array<Album>,
	members: Array<Artist>,
	url: string
}

export class MetalArchivesApi {
	constructor() {
		this.baseUrl = "https://www.metal-archives.com";
		this.tags = [
			'Black',
			'Death',
			'Doom',
			'Stoner',
			'Sludge',
			'Electronic',
			'Industrial',
			'Experimental',
			'Folk',
			'Viking',
			'Gothic',
			'Grindcore',
			'Groove',
			'Heavy',
			'Metalcore',
			'Deathcore',
			'Power',
			'Progressive',
			'Speed',
			'Symphonic',
			'Thrash'
		];
	}

	async getBandInfo(url: string, fullName: string) {
		let band;
		const reponse = await request(url)
							.then( (r) => {
									const band_id = url.split('/').pop();
									const $ = cheerio.load(r);

									let tagsList = Array();
									const genres = $('#band_stats').find('dd').eq(4).text().toLowerCase();
									for (const tag of this.tags) {
										if (genres.includes(tag.toLowerCase())) {
											tagsList.push(tag);
										}
									}

									let membersList = Array();
									$('#band_tab_members_current tr.lineupRow').each(function(i, item) {
										membersList.push({
											memberName: $(item).find('td a').eq(0).text(),
											memberRole: $(item).find('td').eq(1).text()
										});
									});
									band = {
										id: band_id,
										name: $('#band_info>h1.band_name>a').text(),
										fullName: fullName,
										status: $('#band_stats').find('dd').eq(2).text(),
										country: $('#band_stats').find('dd').eq(0).text(),
										formedYear: $('#band_stats').find('dd').eq(3).text(),
										yearsActive: $('#band_stats').find('dd').eq(7).text(),
										genre: $('#band_stats').find('dd').eq(4).text(),
										themes: $('#band_stats').find('dd').eq(5).text(),
										currentLabel: $('#band_stats').find('dd').eq(6).text(),
										description: "",
										discography: Array(),
										members: membersList,
										tags: tagsList,
										url: url
									}
								});
		return band;
	}

	async getBandDescription(band) {
		const url = `${this.baseUrl}/band/read-more/id/${band.id}`;
		const reponse = await request(url)
							.then((r) => {
									const $ = cheerio.load(r);
									band.description = $('body').text();
							});
		return band;

	}

	async getBandDiscography(band, type) {
		const url = `${this.baseUrl}/band/discography/id/${band.id}/tab/${type}`;
		const reponse = await request(url)
							.then((r) => {
								const $ = cheerio.load(r);
								const discographyList = $('table.discog tbody tr').each( function(i, disc) {
									const discType = $(disc).find('td').eq(1).text();
									const discUrl = $(disc).find('td a').eq(0).attr('href');
									let songs = Array();
									band.discography.push({
										discName: $(disc).find('td a').eq(0).text(),
										discType: discType,
										discYear: $(disc).find('td').eq(2).text(),
										discUrl: $(disc).find('td a').eq(0).attr('href'),
										songs: Array()
									});
								});
								return band
							});
		return band;
	}

	async getAlbum(refUrl: string) {
		return await request(refUrl)
								.then((r) => {
									let album: Album;
									const $ = cheerio.load(r);
									const albumInfo = $('#album_info');
									album = {
										name: $('h1.album_name a').text(),
										band: $('h2.band_name a').text().trim(),
										date: $(albumInfo).find('dd').eq(1).text(),
										type: $(albumInfo).find('dd').eq(0).text(),
										label: $(albumInfo).find('dd').eq(3).text(),
										format: $(albumInfo).find('dd').eq(4).text(),
										cover: $('#cover img').attr('src'),
										songs: Array(),
										url: refUrl
									}
									const songsList = $('.table_lyrics tbody tr').filter((i,e) => {
										return $(e).attr('class') && ($(e).attr('class').includes('even') || $(e).attr('class').includes('odd'));
									}).each(function(i, item) {
											album.songs.push({
												songId: -1,
												title: $(item).find('td').eq(1).text().trim(),
												length: $(item).find('td').eq(2).text().trim(),
												lyrics: "" 
											});
									});
									return album;
								});
	}
}
