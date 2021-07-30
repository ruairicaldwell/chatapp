import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { HubConnection } from '@aspnet/signalr';
import * as signalR from '@aspnet/signalr';
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { Subject } from "rxjs";
import { IMessage, ISignalRConnectionInfo } from "../data-models/signal-r.types";
import { HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})

export class SignalRService {

    //private readonly _http: HttpClient;
    private hubConnection: HubConnection;
    messages: Subject<IMessage> = new Subject();

    constructor(private http: HttpClient) {

    }

    private getConnectionInfo(userId: string): Observable<ISignalRConnectionInfo> {
        const requestUrl = `${environment.baseUrl}/api/negotiate`;

        const httpOptions = {
            headers: new HttpHeaders({
              'Content-Type':  'application/json',
              'x-ms-signalr-userid': userId
            })
          };

        return this.http.get<ISignalRConnectionInfo>(requestUrl);
    }

    init(userId: string) {
        console.log(`initializing SignalRService...`);
        this.getConnectionInfo(userId).subscribe(info => {
            console.log(`received info for endpoint ${info.url} access token: ${info.accessToken}`);
            let options = {
                accessTokenFactory: () => info.accessToken
            };

            this.hubConnection = new signalR.HubConnectionBuilder()
                .withUrl(info.url, options)
                .configureLogging(signalR.LogLevel.Information)
                .build();

            this.hubConnection.start().catch(err => console.error(err.toString()));

            this.hubConnection.on('notify', (data: any) => {
                console.log(data);
                this.messages.next(data);
            });

            this.hubConnection.on('newMessage', (data: any) => {
                console.log(data);
                this.messages.next(data);
            });
        });
    }

    send(message: IMessage): Observable<void> {
        const requestUrl = `${environment.baseUrl}/api/message`;
        return this.http.post<void>(requestUrl, message);

    }

    join(groupName: string, userId: string): Observable<void> {
        const httpOptions = {
            headers: new HttpHeaders({
              'Content-Type':  'application/json',
              'x-ms-signalr-userid': userId
            })
          };

        const requestUrl = `${environment.baseUrl}/api/join/${groupName}`;
        return this.http.put<void>(requestUrl, {});
    }
}
